# music-performance-manager

Experimental semantic web based tool for managing live music performances.

Current status: new, not working

The idea: semi-automated monitoring of live performance set-up (computers, instruments, programs, files), evolving to support analysis, trouble-shooting and re-creation of performance set-ups.

Part of the EPSRC-funded FAST IMPACt project (grant	EP/L019981/1).

Copyright (c) The University of Nottingham, 2016

By Chris Greenhalgh, chris.greenhalgh@nottingham.ac.uk

## install

Note: will try to install upstart configuration for mpm as service "mpm".

```
./scripts/install.sh
```

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

