# Design Notes

## Status Overview

To support Climb! performance. 

A single networked status/management server. (Could be federated or hierarchical between different machines in the general case.)

Multiple monitoring agents which report to the status server, e.g. from MAX, musicodes, etc.

Status server supports:
- viewing of current status
- trouble-shooting
- limited automation (via agents).

### Version 0.1 - working 

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
- meld client is running (via browserview)
  - MEI URL
 
See [modelling notes](modelling.md).

### Version 0.2 - working

Browserview exposes test points (i.e. gettable/settable values) for URL, so that template can be used to reload MELD view (e.g. restart climb!).

Musiccodes player view exposes test points for status variables, so that template can be used to set/monitor performance-id (which controls link to mobile app view).

See [climb template](../templates/test.json).

### Future plans

MAX/MSP agent, implemented using JS in MAX object
- MAX/MSP is running
  - which patch(es)
  - (MIDI) input(s)
  - (MIDI) output(s)

## Implementation notes

### Interaction

Reporting agents submit reports periodically to status server.

Status server uses soft state to age/time out agent reports.

Reports can be submitted over various transports, e.g. HTTP, socket.io (future: WebSockets?, OSC?).

Initially everything is trusted :-)

Status reports list any available test points. Dashboard via server can subscribe to updates from test points and request test point values be set.

### Tailoring and control

Dashboard can load "templates" which specify expected processes and also allow simple UI controls to be specified to control test point values (e.g. change browserview URL).

See [specifications.md](specifications.md) for current template file spec.

### Implementation

Initially a node.js server, running as a system service (cf musiccodes).

Persistent logging (machine-readable) to file(s). Each line is a JSON-encoded log record.

Redis for short-term persistence.

Angular.js for UI (just because I am already using it and time is short).

Status server includes is own embedded agent :-) Introspects its own execution environment.

## See also

Some older notes on [using OWL ontologies](owlnotes.md).

Some older notes on [screen configuration](screenmanager.md).

Could use [JSON-LD](https://www.w3.org/TR/json-ld/) compact form(s) in Angular UI model.
