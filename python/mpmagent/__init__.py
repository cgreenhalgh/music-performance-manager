# test report post (python 2.7, not 3)
import httplib
import json

# ip addresses using netifaces

import netifaces
import uuid


import datetime

import sys

# report port
import threading
import random
import time
import os
import socket

class Agent:
    def __init__(self):
        self.ips = []
        for ifaceName in netifaces.interfaces():
            addresses = [i['addr'] for i in netifaces.ifaddresses(ifaceName).setdefault(netifaces.AF_INET, [{'addr':'No IP addr'}] )]
            self.ips.extend(addresses)
        print 'IPs: %s' % (', '.join(self.ips))
        
        self.iri = 'urn:uuid:'+str(uuid.uuid1())
        print 'MPM IRI: %s' % self.iri
        
        self.command = sys.argv[0]

        self.env = {}
        for key in os.environ:
            self.env[key] = os.environ[key]

    def report(self):
        try:
            connection = httplib.HTTPConnection('localhost', 3003)
        
            headers = {'Content-type': 'application/json'}
            now = datetime.datetime.utcnow().isoformat()+'Z'
        
            report = {'@id':self.iri, '@type':'Process', 'expire':10, 'datetime':now, 'processType':'Python', 'title':self.command, 'info':{'ips':self.ips, 'avgv': sys.argv, 'env': self.env }}
            json_report = json.dumps(report)
            #print report
        
            connection.request('POST', '/api/1/mpm-report', json_report, headers)
        
            response = connection.getresponse()
            print "Sent MPM report: {}".format(response.read().decode())
        except httplib.HTTPException as e:
            print "http error sending report - try again next time: {0} {1}".format(e.errno, e.strerror)        
        except socket.error as e:
            print "socket error sending report - try again next time: {0} {1}".format(e.errno, e.strerror)        
        except:
            print "something went wrong sending report: {0} {1}".format(e.errno, e.strerror)
            
    def report_thread(self):
        while True:
            self.report()
            delay = 8+random.randint(0,4)
            time.sleep(delay)    

    def start(self):
        print "run mpmagent"
        t = threading.Thread(target=self.report_thread)
        t.daemon = True
        t.start()

mpmrunning = False
mpmagent = None

def start():
    print "mpmrunning = {}".format(mpmrunning)
    global mpmrunning
    if not mpmrunning:
        mpmrunning = True
        agent = Agent()
        agent.start()
             
#time.sleep(30)
