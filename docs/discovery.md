# Discovery notes

(Especially as discovery can be an issue with Docker containers.)

E.g.
- (Apple) Network MIDI 
- Open Sound Control
- UPnP
- mDNS (`.local` hostnames)

## Open Sound Control

[v1.1](http://cnmat.berkeley.edu/node/7002) 
- "streams are now required to employ SLIP (RFC1055) with a double END characterencoding"
- DNS-SD
- protocol `_osc._udp` or `_osc._tcp`
- attributes are specified in the TXT field 
  - version (`1.0` or `1.1`)
  - framing (`slip` or omit)
  - uri (service 'behind' endpoint)
  - types - tagtype symbols supported
  
## DNS-SD

[rfc6763](http://www.ietf.org/rfc/rfc6763.txt)
- uses PTR, SRV and TXT records
- domain names "<Instance>.<Service>.<Domain>"
  - SRV -> host and port
  - TXT -> service information (key=value pairs)
- query PTR "<Service>.<Domain>" -> list of names
- compatible with mDNS & regular DNS
- domain can be '.local', i.e. link-local multicast DNS


## Multicast DNS 

[RFC6762](http://www.ietf.org/rfc/rfc6762.txt)
- domain 'SOMENAME.local.'
- Any DNS query for a name ending with ".local." MUST be sent to the mDNS IPv4 link-local multicast address 224.0.0.251 (or its IPv6 equivalent FF02::FB)
- port 5353 as destination
- also as source for compliant mDNS querier
- can repeatly query with exponential backoff and known suppression
- response TTL used to limit cache time
- initial queries may request unicast responses, but typically responses are multicast

Mac OS X - see `dns-sd` command-line tool (!)

Register example service (leave running):
```
dns-sd -R Thing _mpm._tcp . 3000
```

Browse:
```
$ dns-sd -B _mpm._tcp .
Browsing for _mpm._tcp
DATE: ---Sun 30 Oct 2016---
21:50:22.645  ...STARTING...
Timestamp     A/R    Flags  if Domain               Service Type         Instance Name
21:50:22.646  Add        2   4 local.               _mpm._tcp.           Thing
...
21:53:16.023  Rmv        0   4 local.               _mpm._tcp.           Thing
```
Lookup:
```
$ dns-sd -L Thing _mpm._tcp .
Lookup Thing._mpm._tcp.local
DATE: ---Sun 30 Oct 2016---
21:50:55.299  ...STARTING...
21:50:55.300  Thing._mpm._tcp.local. can be reached at stross.local.:3000 (interface 4)
```
Address:
```
$ dns-sd -G v4 stross.local.
DATE: ---Sun 30 Oct 2016---
21:51:27.984  ...STARTING...
Timestamp     A/R Flags if Hostname                               Address                                      TTL
21:51:27.984  Add     2  4 stross.local.                          192.168.1.5                                  120
```

Perhaps see also Apple's Bonjour SDK for Windows (used in iTunes).

"The DNS Service Discovery API, declared in /usr/include/dns_sd.h, provide low-level BSD socket communication for Bonjour services. ... DNS Service Discovery is also the API that should be used if developing Bonjour service applications for Windows, Linux, or FreeBSD."

## UPnP

[Wikipedia](https://en.wikipedia.org/wiki/Universal_Plug_and_Play)
- "Device search requests and advertisements are supported by running HTTP on top of UDP (port 1900) using multicast (known as HTTPMU)."

(see also DLNA, SSDP)

## RTP-MIDI

[RTP-MIDI](https://en.wikipedia.org/wiki/RTP-MIDI) aka AppleMIDI
- Uses RTP plus custom session control
- session initiator may establish multiple sessions between its end point and session listener endpoint(s) -> copy out, merge back
- NB each session is 1:1, but initiator end-point can participate in multiple sessions
- requires consecutive 'control' and 'data' ports
- discovery using DNS-SD, service `_apple-midi._udp.`
- Javascript implementation https://github.com/jdachtera/node-rtpmidi
  - requires `avahi_pub` or `mdns2` node modules (first preferred)

There is a windows implementation around.

e.g. (Mac OS X)
```
dns-sd -B _apple-midi._udp .
```


## EQUIP2 discovery

What about my old re-hash of Jini discovery?! Still have to sort out multicast though...

## Docker  

And I mostly want it to work on Mac OSX and Windows hosts, including on wireless networks...

Maybe trying to do it in a container is just making trouble...

[docker multicast](https://github.com/docker/docker/issues/3043)

[pipework](https://github.com/jpetazzo/pipework)

"The last item might be particularly relevant if you are trying to bridge your containers with a WPA-protected WiFi network. I'm not 100% sure about this, but I think that the WiFi access point will drop frames originating from unknown MAC addresses"
 
[could be useful](http://stackoverflow.com/questions/37214608/docker-receiving-multicast-traffic)

 - e.g. Change the TTL of the multicast sender:
```
iptables -t mangle -A OUTPUT -d <group> -j TTL --ttl-set 128
```

Note also various dockerised avahi issues with dbus permissions (search).

And you don't usually have a routable IP address for a container.

This is a mess and rather confusing. E.g. normally there is only one mDNS agent on each machine to start with.


## Multicast proxies

[how to](http://troglobit.com/multicast-howto.html)


