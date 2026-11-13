"""Build the Summit glass pyramid and its block variant, and export them as one GLB.

Run it headless, without opening the Blender UI (Blender 3.6 LTS or newer):

    blender --background --python scripts/blender/build-pyramid.py
    blender --background --python scripts/blender/build-pyramid.py -- --bevel 0.04 --save-blend

Output: public/models/pyramid.glb with two meshes, both centred on the origin:

    Pyramid       square pyramid with softly bevelled edges (the hero object)
    PyramidBlock  a horizontal slice of the same pyramid (project blocks, Faces act)

The dimensions mirror components/canvas/constants.ts (PYRAMID.radius / .height),
so the model drops into the scene in place of the procedural ConeGeometry without
touching the camera or layout. Like three's ConeGeometry with four sides, the
base corners sit on the X and Z axes (a "diamond" seen from above).

No materials or UVs are exported: the glass is MeshTransmissionMaterial, applied
in the scene. The file is not Draco-compressed by default, because at a few
hundred vertices it is already far below the 150 KB budget (PRD 7.1) and an
uncompressed GLB needs no decoder download at runtime. Pass --draco to compress.

`python3 scripts/blender/build-pyramid.py --check` prints the base geometry
without Blender, as a quick sanity check of the numbers.
"""

import math
import os
import sys

try:
    import bmesh
    import bpy
except ImportError:  # plain Python: only --check works
    bpy = None
    bmesh = None

# --- Dimensions, in scene units. Keep in sync with components/canvas/constants.ts.
RADIUS = 1.3  # centre to base corner (ConeGeometry radius)
HEIGHT = 2.2
SIDES = 4

# The block is a slice of the pyramid: same slope, so blocks visually stack into it.
BLOCK_BOTTOM_RADIUS = 1.0
BLOCK_HEIGHT = 0.6

# PRD 7.1: soft bevel, 2-3 segments.
BEVEL_WIDTH = 0.03
BEVEL_SEGMENTS = 3

BUDGET_BYTES = 150 * 1024

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_OUT = os.path.join(ROOT, "public", "models", "pyramid.glb")
DEFAULT_BLEND = os.path.join(ROOT, "scripts", "blender", "pyramid.blend")


def ring(radius, z):
    """Corners of a regular SIDES-gon in the XY plane (Blender is Z-up).

    The corners sit on the X and Y axes. The exporter converts to Y-up, where
    they land on the X and Z axes, like three's ConeGeometry with four sides.
    """
    return [
        (
            radius * math.sin(2 * math.pi * i / SIDES),
            radius * math.cos(2 * math.pi * i / SIDES),
            z,
        )
        for i in range(SIDES)
    ]


def pyramid_geometry():
    """Vertices and faces of the sharp pyramid, centred on the origin."""
    base = ring(RADIUS, -HEIGHT / 2)
    apex = (0.0, 0.0, HEIGHT / 2)
    verts = base + [apex]
    apex_index = SIDES
    # Counter-clockwise seen from outside, so normals point outwards.
    sides = [(i, apex_index, (i + 1) % SIDES) for i in range(SIDES)]
    bottom = [tuple(range(SIDES))]
    return verts, sides + bottom


def block_geometry():
    """Vertices and faces of the block: a frustum with the pyramid's slope."""
    slope = RADIUS / HEIGHT  # radius lost per unit of height
    top_radius = BLOCK_BOTTOM_RADIUS - BLOCK_HEIGHT * slope
    if top_radius <= 0:
        raise ValueError("BLOCK_HEIGHT is too tall for BLOCK_BOTTOM_RADIUS")
    bottom = ring(BLOCK_BOTTOM_RADIUS, -BLOCK_HEIGHT / 2)
    top = ring(top_radius, BLOCK_HEIGHT / 2)
    verts = bottom + top
    sides = [
        (i, i + SIDES, (i + 1) % SIDES + SIDES, (i + 1) % SIDES) for i in range(SIDES)
    ]
    caps = [tuple(range(SIDES)), tuple(reversed(range(SIDES, SIDES * 2)))]
    return verts, sides + caps


def parse_args(argv):
    """Options come after `--` on the Blender command line."""
    args = argv[argv.index("--") + 1 :] if "--" in argv else argv[1:]
    options = {
        "out": DEFAULT_OUT,
        "bevel": BEVEL_WIDTH,
        "segments": BEVEL_SEGMENTS,
        "draco": False,
        "save_blend": None,
        "check": False,
    }
    i = 0
    while i < len(args):
        arg = args[i]
        if arg == "--out":
            options["out"] = os.path.abspath(args[i + 1])
            i += 1
        elif arg == "--bevel":
            options["bevel"] = float(args[i + 1])
            i += 1
        elif arg == "--segments":
            options["segments"] = int(args[i + 1])
            i += 1
        elif arg == "--draco":
            options["draco"] = True
        elif arg == "--save-blend":
            has_path = i + 1 < len(args) and not args[i + 1].startswith("--")
            options["save_blend"] = os.path.abspath(args[i + 1]) if has_path else DEFAULT_BLEND
            i += 1 if has_path else 0
        elif arg == "--check":
            options["check"] = True
        elif arg.endswith(".py"):
            pass  # the script path itself, when run with plain Python
        else:
            raise SystemExit(f"Unknown option: {arg}")
        i += 1
    return options


def build_object(name, verts, faces, bevel_width, bevel_segments):
    """Create a bevelled, smoothly shaded mesh object from raw geometry."""
    bm = bmesh.new()
    bm_verts = [bm.verts.new(v) for v in verts]
    for face in faces:
        bm.faces.new([bm_verts[i] for i in face])
    bm.normal_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    if bevel_width > 0:
        bmesh.ops.bevel(
            bm,
            geom=bm.edges[:],
            offset=bevel_width,
            offset_type="OFFSET",
            segments=bevel_segments,
            profile=0.5,
            affect="EDGES",
            clamp_overlap=True,
        )

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()

    for polygon in mesh.polygons:
        polygon.use_smooth = True
    # Blender before 4.1 needs auto smooth for custom normals; later versions do not.
    if hasattr(mesh, "use_auto_smooth"):
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = math.pi

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    # Weighted normals keep the large faces optically flat and put all of the
    # curvature into the bevel, which is what makes the glass edges catch light.
    modifier = obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    modifier.mode = "FACE_AREA"
    modifier.weight = 100
    modifier.keep_sharp = False
    return obj


def export_glb(path, draco):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    options = dict(
        filepath=path,
        export_format="GLB",
        use_selection=False,
        export_apply=True,  # bakes the weighted normals into the mesh
        export_yup=True,
        export_normals=True,
        export_texcoords=False,
        export_materials="NONE",
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_draco_mesh_compression_enable=draco,
    )
    if draco:
        options.update(
            export_draco_mesh_compression_level=6,
            export_draco_position_quantization=14,
            export_draco_normal_quantization=10,
        )
    bpy.ops.export_scene.gltf(**options)


def triangle_count(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    count = sum(len(polygon.vertices) - 2 for polygon in mesh.polygons)
    vertex_count = len(mesh.vertices)
    evaluated.to_mesh_clear()
    return vertex_count, count


def main():
    options = parse_args(sys.argv)

    if options["check"] or bpy is None:
        for name, (verts, faces) in (
            ("Pyramid", pyramid_geometry()),
            ("PyramidBlock", block_geometry()),
        ):
            print(f"{name}: {len(verts)} vertices, {len(faces)} faces before bevel")
            for vertex in verts:
                print("   ", tuple(round(c, 4) for c in vertex))
        if bpy is None and not options["check"]:
            raise SystemExit(
                "This script needs Blender: blender --background --python " + __file__
            )
        return

    bpy.ops.wm.read_factory_settings(use_empty=True)

    objects = [
        build_object("Pyramid", *pyramid_geometry(), options["bevel"], options["segments"]),
        build_object("PyramidBlock", *block_geometry(), options["bevel"], options["segments"]),
    ]

    for obj in objects:
        vertices, triangles = triangle_count(obj)
        print(f"[model] {obj.name}: {vertices} vertices, {triangles} triangles")

    if options["save_blend"]:
        bpy.ops.wm.save_as_mainfile(filepath=options["save_blend"])
        print(f"[model] saved {options['save_blend']}")

    export_glb(options["out"], options["draco"])
    size = os.path.getsize(options["out"])
    print(f"[model] wrote {options['out']} ({size / 1024:.1f} KB of {BUDGET_BYTES // 1024} KB)")
    if size > BUDGET_BYTES:
        raise SystemExit("[model] over the 150 KB budget (PRD 7.1): try --draco or fewer segments")


if __name__ == "__main__":
    main()
