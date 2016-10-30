require 'serverspec'

set :backend, :exec

describe package('nginx') do 
  it { should be_installed }
end

describe service('nginx') do 
  it { should be_enabled }
  it { should be_running }
end

describe port(80) do
  it { should be_listening }
end

describe port(443) do
  # it { should_not be_listening }
  it { should be_listening }
end

# HTTP only
describe command('curl -s http://localhost') do

# enable SSL/HTTPS
# describe command('curl --insecure -s https://localhost') do
  its(:stdout) { should match /VoteSUp/ }
end
