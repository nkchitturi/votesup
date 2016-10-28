#
# Cookbook Name:: votesup
# Recipe:: default
#


include_recipe 'votesup::nginx_config'
# include_recipe 'votesup::ssl_nginx_config'

include_recipe 'votesup::install_votesup'
