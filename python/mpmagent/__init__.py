# test report post (python 2.7, not 3)
import httplib
import json

# ip addresses using netifaces

import netifaces
ips = []
for ifaceName in netifaces.interfaces():
    addresses = [i['addr'] for i in netifaces.ifaddresses(ifaceName).setdefault(netifaces.AF_INET, [{'addr':'No IP addr'}] )]
    ips.extend(addresses)
print 'IPs: %s' % (', '.join(ips))

import uuid

iri = 'urn:uuid:'+str(uuid.uuid1())
print 'IRI: %s' % iri

import datetime

datetime = datetime.datetime.utcnow().isoformat()+'Z'

import sys

command = sys.argv[0]

# report port
import threading
import random
import time
import os

env = {}
for key in os.environ:
    env[key] = os.environ[key]

def report():

    connection = httplib.HTTPConnection('localhost', 3003)

    headers = {'Content-type': 'application/json'}

    report = {'@id':iri, '@type':'Process', 'expire':10, 'datetime':datetime, 'processType':'Python', 'title':command, 'info':{'ips':ips, 'avgv': sys.argv, 'env': env }}
    json_report = json.dumps(report)
    print report

    connection.request('POST', '/api/1/mpm-report', json_report, headers)

    response = connection.getresponse()
    print(response.read().decode())

def report_thread():
    while True:
        report()
        delay = 8+4*random.randint(0,3)
        time.sleep(delay)

t = threading.Thread(target=report_thread)
t.daemon = True
t.start()

#time.sleep(30)
