#!/usr/bin/env python3
"""Generate original JB Tour glTF 2.0 models with baked animations."""

from __future__ import annotations

import base64
import json
import math
import struct
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "games" / "tour" / "models"


def _f32(values: list[float]) -> bytes:
    return struct.pack("<" + "f" * len(values), *values)


def _u16(values: list[int]) -> bytes:
    return struct.pack("<" + "H" * len(values), *values)


def box(sx: float, sy: float, sz: float) -> tuple[list[float], list[float], list[int]]:
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    faces = [
        ((-hx, hy, -hz), (hx, hy, -hz), (hx, hy, hz), (-hx, hy, hz), (0, 1, 0)),
        ((-hx, -hy, hz), (hx, -hy, hz), (hx, -hy, -hz), (-hx, -hy, -hz), (0, -1, 0)),
        ((-hx, -hy, hz), (-hx, hy, hz), (hx, hy, hz), (hx, -hy, hz), (0, 0, 1)),
        ((hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz), (-hx, -hy, -hz), (0, 0, -1)),
        ((hx, -hy, hz), (hx, hy, hz), (hx, hy, -hz), (hx, -hy, -hz), (1, 0, 0)),
        ((-hx, -hy, -hz), (-hx, hy, -hz), (-hx, hy, hz), (-hx, -hy, hz), (-1, 0, 0)),
    ]
    pos: list[float] = []
    nrm: list[float] = []
    idx: list[int] = []
    for a, b, c, d, n in faces:
        base = len(pos) // 3
        for v in (a, b, c, d):
            pos.extend(v)
            nrm.extend(n)
        idx.extend((base, base + 1, base + 2, base, base + 2, base + 3))
    return pos, nrm, idx


class Gltf:
    def __init__(self, name: str):
        self.name = name
        self.blob = bytearray()
        self.accessors: list[dict] = []
        self.views: list[dict] = []
        self.meshes: list[dict] = []
        self.materials: list[dict] = []
        self.nodes: list[dict] = []
        self.animations: list[dict] = []

    def _push(self, data: bytes, target: int | None = None) -> int:
        pad = (4 - (len(data) % 4)) % 4
        view = {
            "buffer": 0,
            "byteOffset": len(self.blob),
            "byteLength": len(data),
        }
        if target is not None:
            view["target"] = target
        self.views.append(view)
        self.blob.extend(data)
        self.blob.extend(b"\x00" * pad)
        return len(self.views) - 1

    def accessor_f32(self, values: list[float], typ: str, minv=None, maxv=None) -> int:
        comps = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[typ]
        view = self._push(_f32(values), 34962 if typ != "SCALAR" else None)
        acc = {
            "bufferView": view,
            "componentType": 5126,
            "count": len(values) // comps,
            "type": typ,
        }
        if minv is not None:
            acc["min"] = minv
            acc["max"] = maxv
        self.accessors.append(acc)
        return len(self.accessors) - 1

    def accessor_u16(self, values: list[int]) -> int:
        view = self._push(_u16(values), 34963)
        self.accessors.append(
            {
                "bufferView": view,
                "componentType": 5123,
                "count": len(values),
                "type": "SCALAR",
            }
        )
        return len(self.accessors) - 1

    def add_material(self, color: tuple[float, float, float], metallic=0.05, roughness=0.55) -> int:
        self.materials.append(
            {
                "pbrMetallicRoughness": {
                    "baseColorFactor": [*color, 1.0],
                    "metallicFactor": metallic,
                    "roughnessFactor": roughness,
                },
            }
        )
        return len(self.materials) - 1

    def add_box_mesh(self, sx, sy, sz, mat: int) -> int:
        pos, nrm, idx = box(sx, sy, sz)
        xs, ys, zs = pos[0::3], pos[1::3], pos[2::3]
        pi = self.accessor_f32(pos, "VEC3", [min(xs), min(ys), min(zs)], [max(xs), max(ys), max(zs)])
        ni = self.accessor_f32(nrm, "VEC3")
        ii = self.accessor_u16(idx)
        self.meshes.append(
            {
                "primitives": [
                    {
                        "attributes": {"POSITION": pi, "NORMAL": ni},
                        "indices": ii,
                        "material": mat,
                    }
                ]
            }
        )
        return len(self.meshes) - 1

    def add_node(self, **kwargs) -> int:
        self.nodes.append(kwargs)
        return len(self.nodes) - 1

    def add_translation_clip(self, name: str, node: int, times: list[float], keys: list[tuple[float, float, float]]):
        ti = self.accessor_f32(times, "SCALAR", [times[0]], [times[-1]])
        flat = [c for k in keys for c in k]
        oi = self.accessor_f32(flat, "VEC3")
        self.animations.append(
            {
                "name": name,
                "samplers": [{"input": ti, "output": oi, "interpolation": "LINEAR"}],
                "channels": [{"sampler": 0, "target": {"node": node, "path": "translation"}}],
            }
        )

    def add_rotation_clip(self, name: str, node: int, times: list[float], quats: list[tuple[float, float, float, float]]):
        self.add_clip(name, [{"node": node, "path": "rotation", "times": times, "keys": quats}])

    def add_clip(self, name: str, channels: list[dict]):
        samplers = []
        chans = []
        for i, ch in enumerate(channels):
            times = ch["times"]
            keys = ch["keys"]
            typ = "VEC4" if ch["path"] == "rotation" else "VEC3"
            ti = self.accessor_f32(times, "SCALAR", [times[0]], [times[-1]])
            flat = [c for k in keys for c in k]
            oi = self.accessor_f32(flat, typ)
            samplers.append({"input": ti, "output": oi, "interpolation": "LINEAR"})
            chans.append({"sampler": i, "target": {"node": ch["node"], "path": ch["path"]}})
        self.animations.append({"name": name, "samplers": samplers, "channels": chans})

    def write(self):
        OUT.mkdir(parents=True, exist_ok=True)
        uri = "data:application/octet-stream;base64," + base64.b64encode(self.blob).decode("ascii")
        doc = {
            "asset": {"version": "2.0", "generator": "JB Tour asset kit"},
            "scene": 0,
            "scenes": [{"name": self.name, "nodes": [0]}],
            "nodes": self.nodes,
            "meshes": self.meshes,
            "materials": self.materials,
            "accessors": self.accessors,
            "bufferViews": self.views,
            "buffers": [{"byteLength": len(self.blob), "uri": uri}],
            "animations": self.animations,
        }
        path = OUT / f"{self.name}.gltf"
        path.write_text(json.dumps(doc, indent=2))
        return path


def quat_axis(ax, ay, az, rad):
    s = math.sin(rad / 2)
    return (ax * s, ay * s, az * s, math.cos(rad / 2))


def _qx(rad):
    return quat_axis(1, 0, 0, rad)


def _qz(rad):
    return quat_axis(0, 0, 1, rad)


def pawn(name: str, body: tuple[float, float, float], accent: tuple[float, float, float], mascot=False):
    g = Gltf(name)
    body_mat = g.add_material(body)
    accent_mat = g.add_material(accent, metallic=0.35, roughness=0.3)
    skin_mat = g.add_material((0.93, 0.78, 0.66))
    dark = g.add_material((0.12, 0.14, 0.2))
    ident = (0, 0, 0, 1)

    root = g.add_node(name="Root", children=[])

    if mascot:
        body_n = g.add_node(name="Body", mesh=g.add_box_mesh(0.86, 0.95, 0.86, body_mat), translation=[0, 0.62, 0])
        head = g.add_node(name="Head", mesh=g.add_box_mesh(0.5, 0.38, 0.5, accent_mat), translation=[0, 1.22, 0.06])
        wing_l = g.add_node(name="WingL", translation=[-0.42, 0.7, 0], children=[])
        wing_lm = g.add_node(name="WingLMesh", mesh=g.add_box_mesh(0.16, 0.5, 0.62, accent_mat), translation=[-0.12, 0, 0])
        g.nodes[wing_l]["children"] = [wing_lm]
        wing_r = g.add_node(name="WingR", translation=[0.42, 0.7, 0], children=[])
        wing_rm = g.add_node(name="WingRMesh", mesh=g.add_box_mesh(0.16, 0.5, 0.62, accent_mat), translation=[0.12, 0, 0])
        g.nodes[wing_r]["children"] = [wing_rm]
        beak = g.add_node(name="Beak", mesh=g.add_box_mesh(0.2, 0.14, 0.26, accent_mat), translation=[0, 1.12, 0.4])
        leg_l = g.add_node(name="LegL", translation=[-0.18, 0.28, 0], children=[])
        g.nodes[leg_l]["children"] = [
            g.add_node(name="LegLMesh", mesh=g.add_box_mesh(0.16, 0.32, 0.16, dark), translation=[0, -0.16, 0])
        ]
        leg_r = g.add_node(name="LegR", translation=[0.18, 0.28, 0], children=[])
        g.nodes[leg_r]["children"] = [
            g.add_node(name="LegRMesh", mesh=g.add_box_mesh(0.16, 0.32, 0.16, dark), translation=[0, -0.16, 0])
        ]
        g.nodes[root]["children"] = [body_n, head, wing_l, wing_r, beak, leg_l, leg_r]
        t = [0, 0.2, 0.4, 0.6, 0.8]
        flap = [_qz(0.35), _qz(-0.45), _qz(0.35), _qz(-0.45), _qz(0.35)]
        flap_r = [_qz(-0.35), _qz(0.45), _qz(-0.35), _qz(0.45), _qz(-0.35)]
        stride = [_qx(0.45), _qx(-0.45), _qx(0.45), _qx(-0.45), _qx(0.45)]
        stride_r = [_qx(-0.45), _qx(0.45), _qx(-0.45), _qx(0.45), _qx(-0.45)]
        hop_y = [(0, 0, 0), (0, 0.1, 0), (0, 0, 0), (0, 0.1, 0), (0, 0, 0)]
        g.add_clip(
            "idle",
            [
                {"node": root, "path": "translation", "times": [0, 0.5, 1], "keys": [(0, 0, 0), (0, 0.07, 0), (0, 0, 0)]},
                {"node": wing_l, "path": "rotation", "times": [0, 0.5, 1], "keys": [_qz(0.15), _qz(-0.2), _qz(0.15)]},
                {"node": wing_r, "path": "rotation", "times": [0, 0.5, 1], "keys": [_qz(-0.15), _qz(0.2), _qz(-0.15)]},
            ],
        )
        g.add_clip(
            "walk",
            [
                {"node": root, "path": "translation", "times": t, "keys": hop_y},
                {"node": leg_l, "path": "rotation", "times": t, "keys": stride},
                {"node": leg_r, "path": "rotation", "times": t, "keys": stride_r},
                {"node": wing_l, "path": "rotation", "times": t, "keys": flap},
                {"node": wing_r, "path": "rotation", "times": t, "keys": flap_r},
            ],
        )
        g.add_clip("hop", [{"node": root, "path": "translation", "times": [0, 0.22, 0.5], "keys": [(0, 0, 0), (0, 0.28, 0), (0, 0, 0)]}])
        g.add_clip(
            "cheer",
            [
                {"node": wing_l, "path": "rotation", "times": [0, 0.25, 0.5], "keys": [_qz(0.2), _qz(-0.9), _qz(0.2)]},
                {"node": wing_r, "path": "rotation", "times": [0, 0.25, 0.5], "keys": [_qz(-0.2), _qz(0.9), _qz(-0.2)]},
                {"node": root, "path": "translation", "times": [0, 0.25, 0.5], "keys": [(0, 0, 0), (0, 0.16, 0), (0, 0, 0)]},
            ],
        )
        g.add_clip("sad", [{"node": body_n, "path": "rotation", "times": [0, 0.4], "keys": [ident, _qx(0.35)]}])
        g.add_clip(
            "win",
            [
                {"node": root, "path": "translation", "times": [0, 0.25, 0.5, 0.75, 1], "keys": hop_y},
                {"node": wing_l, "path": "rotation", "times": t, "keys": flap},
                {"node": wing_r, "path": "rotation", "times": t, "keys": flap_r},
            ],
        )
        return g.write()

    hip = g.add_node(name="Hip", translation=[0, 0.5, 0], children=[])
    g.nodes[root]["children"] = [hip]

    leg_mesh = g.add_box_mesh(0.18, 0.52, 0.18, dark)
    leg_l = g.add_node(name="LegL", translation=[-0.16, 0, 0], children=[])
    g.nodes[leg_l]["children"] = [g.add_node(name="LegLMesh", mesh=leg_mesh, translation=[0, -0.26, 0])]
    leg_r = g.add_node(name="LegR", translation=[0.16, 0, 0], children=[])
    g.nodes[leg_r]["children"] = [g.add_node(name="LegRMesh", mesh=leg_mesh, translation=[0, -0.26, 0])]

    torso = g.add_node(name="Torso", translation=[0, 0.12, 0], children=[])
    torso_m = g.add_node(name="TorsoMesh", mesh=g.add_box_mesh(0.62, 0.72, 0.38, body_mat), translation=[0, 0.36, 0])
    head = g.add_node(name="Head", mesh=g.add_box_mesh(0.46, 0.46, 0.46, skin_mat), translation=[0, 0.92, 0])

    arm_mesh = g.add_box_mesh(0.14, 0.52, 0.14, body_mat)
    arm_l = g.add_node(name="ArmL", translation=[-0.4, 0.58, 0], children=[])
    g.nodes[arm_l]["children"] = [g.add_node(name="ArmLMesh", mesh=arm_mesh, translation=[0, -0.26, 0])]
    arm_r = g.add_node(name="ArmR", translation=[0.4, 0.58, 0], children=[])
    racket = g.add_node(
        name="Racket",
        mesh=g.add_box_mesh(0.1, 0.72, 0.26, accent_mat),
        translation=[0.02, -0.62, 0.08],
        rotation=list(_qz(-0.25)),
    )
    g.nodes[arm_r]["children"] = [
        g.add_node(name="ArmRMesh", mesh=arm_mesh, translation=[0, -0.26, 0]),
        racket,
    ]
    g.nodes[torso]["children"] = [torso_m, head, arm_l, arm_r]
    g.nodes[hip]["children"] = [leg_l, leg_r, torso]

    t = [0, 0.2, 0.4, 0.6, 0.8]
    a = 0.55
    stride_l = [_qx(a), _qx(-a), _qx(a), _qx(-a), _qx(a)]
    stride_r = [_qx(-a), _qx(a), _qx(-a), _qx(a), _qx(-a)]
    arm_swing_l = [_qx(-0.45), _qx(0.45), _qx(-0.45), _qx(0.45), _qx(-0.45)]
    arm_swing_r = [_qx(0.45), _qx(-0.45), _qx(0.45), _qx(-0.45), _qx(0.45)]
    hop_y = [(0, 0, 0), (0, 0.09, 0), (0, 0, 0), (0, 0.09, 0), (0, 0, 0)]

    g.add_clip(
        "idle",
        [
            {"node": root, "path": "translation", "times": [0, 0.5, 1], "keys": [(0, 0, 0), (0, 0.05, 0), (0, 0, 0)]},
            {"node": arm_r, "path": "rotation", "times": [0, 0.5, 1], "keys": [_qx(0.08), _qx(-0.08), _qx(0.08)]},
        ],
    )
    g.add_clip(
        "walk",
        [
            {"node": root, "path": "translation", "times": t, "keys": hop_y},
            {"node": leg_l, "path": "rotation", "times": t, "keys": stride_l},
            {"node": leg_r, "path": "rotation", "times": t, "keys": stride_r},
            {"node": arm_l, "path": "rotation", "times": t, "keys": arm_swing_l},
            {"node": arm_r, "path": "rotation", "times": t, "keys": arm_swing_r},
        ],
    )
    g.add_clip(
        "hop",
        [
            {"node": root, "path": "translation", "times": [0, 0.2, 0.5], "keys": [(0, 0, 0), (0, 0.32, 0), (0, 0, 0)]},
            {"node": leg_l, "path": "rotation", "times": [0, 0.2, 0.5], "keys": [ident, _qx(-0.4), ident]},
            {"node": leg_r, "path": "rotation", "times": [0, 0.2, 0.5], "keys": [ident, _qx(-0.4), ident]},
        ],
    )
    g.add_clip(
        "cheer",
        [
            {"node": arm_r, "path": "rotation", "times": [0, 0.25, 0.5], "keys": [ident, _qx(-1.35), ident]},
            {"node": arm_l, "path": "rotation", "times": [0, 0.25, 0.5], "keys": [ident, _qx(-0.9), ident]},
            {"node": root, "path": "translation", "times": [0, 0.25, 0.5], "keys": [(0, 0, 0), (0, 0.14, 0), (0, 0, 0)]},
        ],
    )
    g.add_clip(
        "sad",
        [
            {"node": torso, "path": "rotation", "times": [0, 0.35], "keys": [ident, _qx(0.4)]},
            {"node": arm_l, "path": "rotation", "times": [0, 0.35], "keys": [ident, _qx(0.35)]},
            {"node": arm_r, "path": "rotation", "times": [0, 0.35], "keys": [ident, _qx(0.35)]},
        ],
    )
    g.add_clip(
        "win",
        [
            {"node": root, "path": "translation", "times": [0, 0.25, 0.5, 0.75, 1], "keys": hop_y},
            {"node": arm_r, "path": "rotation", "times": t, "keys": [_qx(-0.2), _qx(-1.2), _qx(-0.2), _qx(-1.2), _qx(-0.2)]},
            {"node": arm_l, "path": "rotation", "times": t, "keys": [_qx(-0.2), _qx(-0.9), _qx(-0.2), _qx(-0.9), _qx(-0.2)]},
            {"node": leg_l, "path": "rotation", "times": t, "keys": stride_l},
            {"node": leg_r, "path": "rotation", "times": t, "keys": stride_r},
        ],
    )
    return g.write()


def _pip_mesh(g, pip_mat: int) -> int:
    return g.add_box_mesh(0.28, 0.28, 0.1, pip_mat)


def dice():
    g = Gltf("dice")
    mat = g.add_material((0.99, 0.99, 1.0), metallic=0.0, roughness=0.22)
    pip = g.add_material((0.07, 0.12, 0.38), metallic=0.05, roughness=0.35)
    pm = _pip_mesh(g, pip)
    cube = g.add_box_mesh(1.05, 1.05, 1.05, mat)
    face = 0.57
    layout = {
        1: [(0, 0)],
        2: [(-0.26, -0.26), (0.26, 0.26)],
        3: [(-0.26, -0.26), (0, 0), (0.26, 0.26)],
        4: [(-0.26, -0.26), (0.26, -0.26), (-0.26, 0.26), (0.26, 0.26)],
        5: [(-0.26, -0.26), (0.26, -0.26), (0, 0), (-0.26, 0.26), (0.26, 0.26)],
        6: [
            (-0.26, -0.28),
            (0.26, -0.28),
            (-0.26, 0),
            (0.26, 0),
            (-0.26, 0.28),
            (0.26, 0.28),
        ],
    }
    # +Z=1, -Z=6, +X=2, -X=5, +Y=3, -Y=4
    placements = []
    for a, b in layout[1]:
        placements.append((a, b, face))
    for a, b in layout[6]:
        placements.append((a, b, -face))
    for a, b in layout[2]:
        placements.append((face, b, a))
    for a, b in layout[5]:
        placements.append((-face, b, a))
    for a, b in layout[3]:
        placements.append((a, face, b))
    for a, b in layout[4]:
        placements.append((a, -face, b))

    child_ids = [1]
    g.add_node(name="Root", children=[])
    g.add_node(name="Cube", mesh=cube)
    for i, (x, y, z) in enumerate(placements):
        nid = g.add_node(name=f"Pip{i + 1}", mesh=pm, translation=[x, y, z])
        child_ids.append(nid)
    g.nodes[0]["children"] = child_ids
    times = [0, 0.12, 0.24, 0.36, 0.5]
    quats = [
        quat_axis(1, 0, 0, 0),
        quat_axis(1, 1, 0, 2.1),
        quat_axis(0, 1, 1, 4.2),
        quat_axis(1, 0, 1, 5.5),
        quat_axis(0, 1, 0, math.pi / 2),
    ]
    g.add_rotation_clip("roll", 0, times, quats)
    return g.write()


def coin():
    g = Gltf("coin")
    gold = g.add_material((0.95, 0.76, 0.2), metallic=0.9, roughness=0.22)
    g.add_node(name="Root", children=[1])
    g.add_node(name="Disc", mesh=g.add_box_mesh(0.9, 0.9, 0.14, gold))
    times = [0, 0.25, 0.5, 0.75, 1]
    quats = [quat_axis(0, 1, 0, a) for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2, 2 * math.pi)]
    g.add_rotation_clip("spin", 1, times, quats)
    return g.write()


def shuttle():
    g = Gltf("shuttle")
    cork = g.add_material((0.96, 0.93, 0.86))
    gold = g.add_material((0.95, 0.76, 0.2), metallic=0.8, roughness=0.3)
    skirt = g.add_material((0.98, 0.98, 0.99))
    g.add_node(name="Root", children=[1, 2, 3])
    g.add_node(name="Cork", mesh=g.add_box_mesh(0.32, 0.28, 0.32, cork), translation=[0, 0.14, 0])
    g.add_node(name="Band", mesh=g.add_box_mesh(0.36, 0.08, 0.36, gold), translation=[0, 0.3, 0])
    g.add_node(name="Skirt", mesh=g.add_box_mesh(0.7, 0.7, 0.7, skirt), translation=[0, 0.72, 0])
    g.add_clip(
        "idle",
        [
            {"node": 0, "path": "translation", "times": [0, 0.5, 1], "keys": [(0, 0, 0), (0, 0.12, 0), (0, 0, 0)]},
            {"node": 0, "path": "rotation", "times": [0, 0.5, 1], "keys": [_qz(-0.08), _qz(0.08), _qz(-0.08)]},
        ],
    )
    g.add_clip(
        "fly",
        [
            {
                "node": 0,
                "path": "translation",
                "times": [0, 0.25, 0.5, 0.75, 1],
                "keys": [(0, 0, 0), (0.12, 0.22, 0), (0, 0.08, 0.08), (-0.1, 0.2, 0), (0, 0, 0)],
            },
            {
                "node": 0,
                "path": "rotation",
                "times": [0, 0.5, 1],
                "keys": [_qz(-0.35), _qz(0.35), _qz(-0.35)],
            },
        ],
    )
    return g.write()


def _house_level(g: Gltf, level: int, wall: int, roof: int, trim: int, dark: int):
    """Append 3D building parts for one upgrade level. Returns child node ids."""
    kids = []

    def part(name, mesh, t):
        kids.append(g.add_node(name=name, mesh=mesh, translation=list(t)))

    if level == 1:
        part("Walls", g.add_box_mesh(0.95, 0.62, 0.8, wall), (0, 0.31, 0))
        part("Roof", g.add_box_mesh(1.12, 0.28, 0.96, roof), (0, 0.76, 0))
        part("Door", g.add_box_mesh(0.22, 0.32, 0.06, dark), (0, 0.18, 0.42))
        part("WinL", g.add_box_mesh(0.16, 0.16, 0.05, trim), (-0.28, 0.38, 0.42))
        part("WinR", g.add_box_mesh(0.16, 0.16, 0.05, trim), (0.28, 0.38, 0.42))
    elif level == 2:
        part("L1", g.add_box_mesh(1.0, 0.58, 0.85, wall), (0, 0.29, 0))
        part("L2", g.add_box_mesh(0.92, 0.55, 0.78, wall), (0, 0.84, 0))
        part("Roof", g.add_box_mesh(1.1, 0.3, 0.95, roof), (0, 1.24, 0))
        part("Door", g.add_box_mesh(0.22, 0.32, 0.06, dark), (0, 0.18, 0.44))
        part("W1", g.add_box_mesh(0.18, 0.18, 0.05, trim), (-0.28, 0.86, 0.42))
        part("W2", g.add_box_mesh(0.18, 0.18, 0.05, trim), (0.28, 0.86, 0.42))
    elif level == 3:
        part("L1", g.add_box_mesh(1.08, 0.55, 0.9, wall), (0, 0.28, 0))
        part("L2", g.add_box_mesh(1.0, 0.52, 0.82, wall), (0, 0.8, 0))
        part("L3", g.add_box_mesh(0.9, 0.5, 0.74, wall), (0, 1.28, 0))
        part("Roof", g.add_box_mesh(1.08, 0.32, 0.9, roof), (0, 1.66, 0))
        part("Chimney", g.add_box_mesh(0.16, 0.38, 0.16, dark), (0.28, 1.92, -0.12))
        part("Door", g.add_box_mesh(0.24, 0.34, 0.06, dark), (0, 0.18, 0.47))
        part("W1", g.add_box_mesh(0.16, 0.16, 0.05, trim), (-0.3, 0.82, 0.44))
        part("W2", g.add_box_mesh(0.16, 0.16, 0.05, trim), (0.3, 0.82, 0.44))
        part("W3", g.add_box_mesh(0.16, 0.16, 0.05, trim), (0, 1.3, 0.4))
    else:
        part("Podium", g.add_box_mesh(1.35, 0.28, 1.15, wall), (0, 0.14, 0))
        part("Tower", g.add_box_mesh(0.85, 1.35, 0.75, wall), (0, 0.95, 0))
        part("Crown", g.add_box_mesh(1.05, 0.22, 0.95, roof), (0, 1.7, 0))
        part("Spire", g.add_box_mesh(0.12, 0.55, 0.12, trim), (0, 2.08, 0))
        part("Door", g.add_box_mesh(0.28, 0.36, 0.08, dark), (0, 0.22, 0.58))
        part("W1", g.add_box_mesh(0.16, 0.2, 0.05, trim), (-0.22, 0.85, 0.4))
        part("W2", g.add_box_mesh(0.16, 0.2, 0.05, trim), (0.22, 0.85, 0.4))
        part("W3", g.add_box_mesh(0.16, 0.2, 0.05, trim), (-0.22, 1.2, 0.4))
        part("W4", g.add_box_mesh(0.16, 0.2, 0.05, trim), (0.22, 1.2, 0.4))
        part("Flag", g.add_box_mesh(0.28, 0.16, 0.04, roof), (0.16, 2.22, 0))
    return kids


def house_file(name: str, level: int, wall_rgb=(0.18, 0.42, 0.9)):
    g = Gltf(name)
    wall = g.add_material(wall_rgb)
    roof = g.add_material((0.86, 0.22, 0.22) if level < 4 else (0.95, 0.76, 0.18), metallic=0.2, roughness=0.35)
    trim = g.add_material((0.98, 0.9, 0.45), metallic=0.4, roughness=0.3)
    dark = g.add_material((0.18, 0.2, 0.28))
    g.add_node(name="Root", children=[])
    kids = _house_level(g, level, wall, roof, trim, dark)
    g.nodes[0]["children"] = kids
    g.add_translation_clip("pop", 0, [0, 0.18, 0.4], [(0, -0.45, 0), (0, 0.1, 0), (0, 0, 0)])
    return g.write()


def house():
    """Kit: 4 upgrade levels in a row (lv1..lv4)."""
    g = Gltf("house")
    wall = g.add_material((0.18, 0.42, 0.9))
    roof = g.add_material((0.86, 0.22, 0.22))
    gold = g.add_material((0.95, 0.76, 0.18), metallic=0.45, roughness=0.3)
    trim = g.add_material((0.98, 0.9, 0.45), metallic=0.4, roughness=0.3)
    dark = g.add_material((0.18, 0.2, 0.28))
    g.add_node(name="Root", children=[])
    group_ids = []
    for lv, x in enumerate((-2.7, -0.9, 0.9, 2.7), start=1):
        gid = g.add_node(name=f"Level{lv}", translation=[x, 0, 0], children=[])
        roof_mat = gold if lv == 4 else roof
        kids = _house_level(g, lv, wall, roof_mat, trim, dark)
        g.nodes[gid]["children"] = kids
        group_ids.append(gid)
    g.nodes[0]["children"] = group_ids
    g.add_translation_clip("pop", 0, [0, 0.18, 0.4], [(0, -0.45, 0), (0, 0.1, 0), (0, 0, 0)])
    return g.write()


def main():
    written = [
        pawn("pawn_ace", (0.18, 0.42, 0.92), (0.98, 0.78, 0.18)),
        pawn("pawn_ruby", (0.86, 0.18, 0.48), (0.98, 0.78, 0.86)),
        pawn("pawn_kiwi", (0.45, 0.72, 0.16), (0.98, 0.62, 0.12), mascot=True),
        pawn("pawn_blaze", (0.92, 0.42, 0.1), (0.12, 0.12, 0.14)),
        dice(),
        coin(),
        shuttle(),
        house(),
        house_file("house_lv1", 1),
        house_file("house_lv2", 2),
        house_file("house_lv3", 3),
        house_file("house_lv4", 4),
    ]
    def clips_for(stem: str) -> list[str]:
        if stem.startswith("pawn_"):
            return ["idle", "walk", "hop", "cheer", "sad", "win"]
        if stem == "dice":
            return ["roll"]
        if stem == "coin":
            return ["spin"]
        if stem == "shuttle":
            return ["idle", "fly"]
        return ["pop"]

    manifest = {
        "id": "jb-tour",
        "format": "glTF 2.0",
        "houseLevels": [
            {"level": n, "id": f"house_lv{n}", "url": f"/games/tour/models/house_lv{n}.gltf"}
            for n in range(1, 5)
        ],
        "models": [
            {
                "id": p.stem,
                "url": f"/games/tour/models/{p.name}",
                "clips": clips_for(p.stem),
            }
            for p in written
        ],
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    for p in written:
        print(p)


if __name__ == "__main__":
    main()
