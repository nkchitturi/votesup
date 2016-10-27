#
# Cookbook Name:: votesup
# Recipe:: prereqs
#

if ['rhel', 'amazon'].include?(node['platform'])
  execute 'yum upgrade -y'
end
if ['ubuntu'].include?(node['platform'])
  execute 'aptitude update'
  execute 'aptitude upgrade -y'
end

include_recipe 'nginx'
include_recipe 'votesup::nodejs'
include_recipe 'votesup::yum_packages'

service 'nginx' do
  action [ :stop, :disable ]
end

execute 'touch /.votesup-prereqs-installed'
