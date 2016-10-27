#
# Cookbook Name:: votesup
# Recipe:: nginx_config
#
# Copyright (C) 2015 SungardAS
#
# All rights reserved - Do Not Redistribute
#

cookbook_file '/etc/nginx/sites-available/votesup' do
  source 'nginx/ssl-votesup-site.cfg'
  owner 'root'
  group 'root'
  mode '0644'
  action :create
end

cookbook_file '/tmp/generate-cert.sh' do
  source 'nginx/generate-cert.sh'
  owner 'root'
  group 'root'
  mode '0700'
  action :create
end

execute 'generate-cert' do
  cwd '/tmp'
  command '/tmp/generate-cert.sh votesup' 
end

directory '/etc/nginx/ssl/' do
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

remote_file '/etc/nginx/ssl/nginx.crt' do
  source 'file:///tmp/votesup.crt'
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

remote_file '/etc/nginx/ssl/nginx.key' do
  source 'file:///tmp/votesup.key'
  owner 'root'
  group 'root'
  mode '0755'
  action :create
end

link '/etc/nginx/sites-enabled/000-default' do
  to '/etc/nginx/sites-available/votesup'
end

service 'nginx' do
  action [ :start, :enable ]
end
