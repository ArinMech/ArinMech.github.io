# Topology Optimization — Planar FEA

MATLAB implementation of density-based topology optimization using a custom 2D plane-stress finite element solver.

## Model and load case

- **Design domain:** 4 m × 2 m, thickness 0.025 m
- **Mesh:** 40 × 20 four-node quadrilateral (Q4) elements; 800 elements total
- **Boundary conditions:** left edge fixed
- **Load:** 100 kN downward at (4 m, 1 m)
- **Material:** steel, E = 210 GPa, Poisson's ratio = 0.30
- **Constraint:** downward displacement at loaded node no more than 1 mm
- **Design densities:** 0.01–1.00; SIMP penalty p = 3
- **Density filter radius:** 0.2 m

## Numerical implementation

The MATLAB code contains mesh generation, Q4 element stiffness with 2 × 2 Gauss integration, sparse global assembly, a normalized density filter, constraint sensitivities using an adjoint calculation, and numerical optimization using `fmincon`.

## Optimization trials

The recorded runs compared a full-density starting field, a uniform initial density (0.5), and heuristic starting designs.

| Run | Starting design | Reported final objective |
| --- | --- | ---: |
| 01 | Full density | 980.7436 |
| 02 | Uniform density 0.5 | 965.1008 |
| 03 | Parabolic heuristic design | 965.1008 |
| 04 | Triangular heuristic design | 965.3248 |
| 05 | Restart from triangular heuristic design | 981.0592 |

These results were reported by the supplied MATLAB runs. Different starting points may converge to different local solutions.

## Source code

**[Topology_Optimization_Source.m](Topology_Optimization_Source.m)** — the MATLAB implementation including the finite element model and optimization trials.

For the graphical load schematic and project presentation, see the [portfolio case study](../project-topology.html).
