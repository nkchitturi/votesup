#
# Cookbook Name:: votesup
# Recipe:: nginx_config
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
