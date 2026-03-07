## M.A.N.G.O v1.1.0

This release marks a crucial update in the quality and organization of the M.A.N.G.O. project's documentation and codebase. We've implemented a new, standardized directory structure to ensure more intuitive navigation and clear modularity between the hardware, software, and core documentation components. Furthermore, the introduction of the ARCHITECTURE.md document formalizes the system's technical vision, significantly improving comprehension for new collaborators and researchers.

# Changelog
-  ## Added / New Features
	Formalized Architecture Document (ARCHITECTURE.md): A dedicated document has been added to describe the five system layers in detail (Hardware, Firmware, Communication, Data, Visualization) and their data flow, including a textual architecture diagram.

-  ## Changed / Major Changes
Major Repository Structure Refactoring: 
	A standardized and clear directory organization is implemented to improve file traceability. Key changes include the consolidation of high-level documentation in the root directory and the restructuring of software and hardware subfolders.

## Improved / Enhancements
- ### Visual Improvement of README.md: 
The main file has been updated to include a set of more professional and dynamic badges (img.shields.io), offering an instant status of the project (version, licenses, issues, etc.).

- ### Hardware Component Clarification: 
The technology stack documentation and the hardware layer in ARCHITECTURE.md now reflect the use of NVIDIA Jetson TK1 as the central micro-PC.

- ### Documentation Consistency: 
Governance files (CONTRIBUTING.md, CODE_OF_CONDUCT.md) were reviewed and updated to reflect the current structure and new collaboration guidelines.

- ## Fixed / Bug Fixes
Naming Standard: 
Implicit correction of previous inconsistencies in directory naming and anchors in the README.md Table of Contents to use lowercase and hyphens, ensuring functional internal links consistent with best practices.

## Next Steps (Pending Tasks)
* Complete LoRa Integration: 
	Finalize long-range communication tests and establish a stable connection between the transmitter and the gateway.
 * Dashboard Development: 
	Start the implementation of the visualization Dashboard using the selected technology (Grafana or Custom Web) for direct reading from the database.
* Pilot Site Definition: 
	Formally select the location for the first pilot test on the Colombian Pacific coast (Tumaco, Buenaventura, or Nuquí) for field testing.