#
# Cookbook Name:: votesup
# Recipe:: default
#


# Recipe for configuring NGINX
include_recipe 'votesup::nginx_config'

# Recipe for configuring NGINX with SSL
# include_recipe 'votesup::ssl_nginx_config'

# Recipe for configuring VoteSUp app
include_recipe 'votesup::install_votesup'
