#
# Cookbook Name:: votesup
# Recipe:: default
#
# Copyright (C) 2015 SungardAS
#
# All rights reserved - Do Not Redistribute
#

include_recipe 'votesup::nginx_config'
# include_recipe 'votesup::ssl_nginx_config'

include_recipe 'votesup::install_votesup'
