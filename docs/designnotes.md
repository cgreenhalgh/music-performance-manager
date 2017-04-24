# Design Notes

## JSON-LD

Could use [JSON-LD](https://www.w3.org/TR/json-ld/) compact form(s) in Angular UI model.

## Status Overview

To support Climb! performance. 

A single networked status/management server. (Could be federated or hierarchical between different machines in the general case.)

Multiple monitoring agents which report to the status server, e.g. from MAX, musicodes, etc.

Status server supports:
- viewing of current status
- trouble-shooting
- limited automation (via agents).

### Version 0.1 aims

Dashboard view from status server.

Indicate if:
- musicides server is running
  - associated URL (host, port)
- musicodes (player) is running
  - associated experience
  - input(s)
  - output(s)
- meld server is running
  - associated URL (host, port)
- meld client is running
  - MEI URL
  
See [modelling notes](modelling.md).
  
version 0.2:
- MAX/MSP is running
  - which patch(es)
  - (MIDI) input(s)
  - (MIDI) output(s)

## Implementation notes

### Interaction

Reporting agents submit reports periodically to status server.

Status server uses soft state to age/time out agent reports.

Reports can be submitted over various transports, e.g. HTTP, socket.io (WebSockets?, OSC?).

Initially everything is trusted :-)

### Implementation

Initially a node.js server, running as a system service (cf musiccodes).

Persistent logging (machine-readable) to file(s). Each line is a JSON-encoded log record.

? Redis for short-term persistence and local coordination ?

Angular.js for UI (just because I am already using it and time is short).

Status server includes is own embedded agent :-) Introspects its own execution environment.

## See also

Some older notes on [using OWL ontologies](owlnotes.md).

Some older notes on [screen configuration](screenmanager.md).
