#
# Cookbook Name:: votesup
# Recipe:: node_modules
#


remote_directory '/votesup' do
  source 'app'
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

directory '/votesup/log' do
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

bash 'votesup' do
  user 'root'
  flags '-ex'
  code <<-EOH
if /usr/local/bin/forever list | grep -q '^data:'; then
  /usr/local/bin/forever stopall
  sleep 1
fi
/usr/local/bin/forever /votesup/app.js >> /votesup/log/server.log 2>&1 &
EOH
end
