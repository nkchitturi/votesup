#
# Cookbook Name:: votesup
# Recipe:: nginx_config
#
# Copyright (C) 2015 SungardAS
#
# All rights reserved - Do Not Redistribute
#

cookbook_file '/etc/nginx/sites-available/votesup' do
  source 'nginx/votesup-site.cfg'
  owner 'root'
  group 'root'
  mode '0644'
  action :create
end

link '/etc/nginx/sites-enabled/000-default' do
  to '/etc/nginx/sites-available/votesup'
end

service 'nginx' do
  action [ :start, :enable ]
end
