# Modelling notes

## General / principles

Focussed, initially task-specific, incrementally refined.

Using ideas from [Bigraphs](https://en.wikipedia.org/wiki/Bigraph), specifically:
- provileging a place/containment hierarchy
- nodes, which may be typed (by "contols"), having ports
- graph of names connecting ports for non-place relationships

Mapping to Semantic Web ideas.

Aligning with (or at least sympathetic to) Music Ontology and in particular Studio Ontology concepts where possible.

## Initial Entities

- Execution environment, e.g. OS on PC or in VM, plugin hosting environment, browser
- Execution platform, e.g. PC or VM
- Process, e.g. server (in OS), web page/app (in browser), ?patch (in Max), ??plugin (in host)
- File (or document), in execution environment
- ? FileSet (or filesystem or ?namespace?), in execution environment; may be linked to external storage 
- Configuration, e.g. experience file (in musicodes), patch file (in Max)

### Execution Platform

Inferred from an agent running within a nested execution environment.

### Execution Environment

Inferred by an agent running (successfully) within that execution environment.



### Process

Implicit in execution of an embedded agent, or reported by the process' execution environment to an agent external to the process (e.g. a general system process monitor).

### File

Reported by embedded agent when explicitly used/accessed by a process, or reported by the execution environment 

## IRIs

Agents can generate their own GUIDs dynamically (randomly).

Equality/identity of (e.g.) other entities may be inferred from observations of properties 
(e.g. same IP address at same time), or from explicit sharing of information through local 
channels, e.g. well-known local file, loopback communication (beware port forwarding and
proxying), local multicast.
