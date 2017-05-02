# install
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# redis
sudo apt-get install redis-server
# note: logfile /var/log/redis/redis-server.log
# note: dir /var/lib/redis
# note: port 6379
# note: bind 127.0.0.1

# python netifaces

sudo easy_install netifaces

# upstart system
sudo cp $DIR/mpm.conf /etc/init/
if ! [ -z "$DIR" ]; then
PDIR=$( dirname "$DIR" )
sudo sed -i "s:/vagrant:$PDIR:g" /etc/init/mpm.conf
fi

if ! (status mpm | grep -q "^mpm start" > /dev/null); then
sudo service mpm start
fi

