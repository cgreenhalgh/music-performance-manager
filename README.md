# music-performance-manager

Experimental semantic web based tool for managing live music performances.

Current status: new, working with [Musiccodes](https://github.com/cgreenhalgh/musiccodes) and 
[FAST performance demonstrator](https://github.com/cgreenhalgh/fast-performance-demo) (Muzi-MELD/Climb!)

The idea: semi-automated monitoring of live performance set-up (computers, instruments, programs, files), evolving to support analysis, trouble-shooting and re-creation of performance set-ups.

Part of the EPSRC-funded FAST IMPACt project (grant	EP/L019981/1).

Copyright (c) The University of Nottingham, 2016

By Chris Greenhalgh, chris.greenhalgh@nottingham.ac.uk

## install

Note: upstart configuration for mpm as service "mpm" in `scripts/mpm.conf`.

```
./scripts/install.sh
```

## Overview

The server runs in the background on a control machine. Reporting agents in other processes connect to the server (via HTTP or socket.io) to provide it with up to date information about what is happening and optionally to allow those processes to be remote controlled from the dashboard (below).

See also [docs/designnotes.md](docs/designnotes.md).

## Usage

### Dashboard

The dashbaord in the main control/management UI.

[http://localhost:3003/dashboard.html](http://localhost:3003/dashboard.html)

To use a template (which specifies expected processes and provides some control actions) select one from the drop-down at the top and load it. There is (as of 2017-06-23) a cludgy option to search/replace the IP address on load if filled in.

Templates by default are in the directory `templates\`. There is a [template file format specification](docs/specifications.md).

### Browserview

The browserview is used to host a single browser view, which can be managed and controlled (at least setting URL) from the dashboard.

Parameter 'n' = view name, 'u' = url, e.g.
```
http://localhost:3003/browserview.html?n=name&u=http:%2F%2Flocalhost:3000
```

Mouse to top of page to review config.

### Other Agents

Reporting agents can be embedded in other applications. For example:

- player views of [Musiccodes](https://github.com/cgreenhalgh/musiccodes) 
- server of [MELD branch mpm](https://github.com/cgreenhalgh/meld/tree/mpm) 

Currently there is are agents of some form for:

- node.js (`lib/mpm-agent.js\)
- browser (angular.js) (`public/js/mpm-agent.js`)
- python (`python/mpmagent/`)

## Testing

For now, see musiccodes for some of the set-up for Karma tests (`npm test`) - needs Chrome and local (not global) install of Karma (but that is a problem with links on Windows)

Run the server as
```
node lib/server.js
```

Open [http://localhost:3003](http://localhost:3003)

Run the node agent:
```
node lib/agent.js
```

## interaction

Socket.io: agent emits message mpm-report to server.

HTTP: agent does POST to /api/1/mpm-report with JSON body.
e.g.
```
curl -H "Content-Type: application/json" -X POST -d '{"@id":"urn:123","@type":"Test"}' http://localhost:3003/api/1/mpm-report
```

Additional messages are using over socket.io for interaction with test points (to be documented).
