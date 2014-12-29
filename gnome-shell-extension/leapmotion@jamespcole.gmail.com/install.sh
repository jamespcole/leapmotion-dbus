#!/bin/bash

function require_command_from_repo {
	local __resultvar=$4
	if command -v $1 >/dev/null 2>&1; then		
		print_info "The $1 command is already installed"		
		local install_result='already_installed'
		eval $__resultvar="'$install_result'"
	else
		# tput setaf 3
		# echo >&2 "The $1 command is required but is not installed.";
		print_warning "The $1 command is required but is not installed."

		while true; do
			read -p "Do you wish to install $1 automatically now?(Y/N)" yn
			case $yn in
				[Yy]* )
					tput sgr0;
					sudo add-apt-repository $3
					sudo apt-get update
					sudo apt-get install $2;
					local install_result='newly_installed'
					eval $__resultvar="'$install_result'"
					break;;
				[Nn]* ) tput sgr0; exit;;
				* ) echo "Please answer yes or no.";;
			esac
		done;
	fi
}

function require_command {
	local __resultvar=$3
	if command -v $1 >/dev/null 2>&1; then
		
		print_info "The $1 command is already installed"
		
		local install_result='already_installed'
		eval $__resultvar="'$install_result'"
	else
		# tput setaf 3
		# echo >&2 "The $1 command is required but is not installed.";
		print_warning "The $1 command is required but is not installed."

		while true; do
			read -p "Do you wish to install $1 automatically now?(Y/N)" yn
			case $yn in
				[Yy]* )
					tput sgr0;
					sudo apt-get install $2;
					local install_result='newly_installed'
					eval $__resultvar="'$install_result'"
					break;;
				[Nn]* ) tput sgr0; exit;;
				* ) echo "Please answer yes or no.";;
			esac
		done;
	fi
}

function install_from_url {
	local  __resultvar=$4
	if command -v $1 >/dev/null 2>&1; then
		
		print_info "The $1 command is already installed"
		
		local install_result='already_installed'
		eval $__resultvar="'$install_result'"
	else
		# tput setaf 3
		# echo >&2 "The $1 command is required but is not installed.";
		print_warning "The $1 command is required but is not installed."

		while true; do
			read -p "Do you wish to install $1 automatically now?(Y/N)" yn
			case $yn in
				[Yy]* )
					tput sgr0;
					wget -O "/tmp/$3" $2
					sudo dpkg -i "/tmp/$3";
					local install_result='newly_installed'
					eval $__resultvar="'$install_result'"
					break;;
				[Nn]* ) tput sgr0; exit;;
				* ) echo "Please answer yes or no.";;
			esac
		done;
	fi
}

function install_leap_motion {
	if command -v leapd >/dev/null 2>&1; then
		print_info "The leapd command is already installed"
	else
		print_warning "The leapd command is required but is not installed."

		while true; do
			read -p "Do you wish to install leapd automatically now?(Y/N)" yn
			case $yn in
				[Yy]* )
					tput sgr0;
					wget -O /tmp/leap_install.tgz https://warehouse.leapmotion.com/apps/3834/download
					tar zxvf /tmp/leap_install.tgz -C /tmp/
					
					arch=$(uname -m)

					if [ "$arch" = 'x86_64' ]
					then
						print_info "64bit architecture detected"
						sudo dpkg -i /tmp/Leap_Motion_Installer_Packages_release_public_linux/Leap-*-x64.deb
					else
					    print_info "32bit architecture detected"
					    sudo dpkg -i /tmp/Leap_Motion_Installer_Packages_release_public_linux/Leap-*-x86.deb
					fi
					print_info "Cleaning up install files..."
					rm /tmp/leap_install.tgz
					rm -r /tmp/Leap_Motion_Installer_Packages_release_public_linux

					print_info "Starting the leapd service..."
					sudo /etc/init.d/leapd restart

					break;;
				[Nn]* ) tput sgr0; exit;;
				* ) print_warning "Please answer yes or no.";;
			esac
		done;
	fi
}


function install_global_npm_package {
	local __resultvar=$3
	
	if command -v $2 >/dev/null 2>&1; then
		print_info "The $2 command is already installed"
		local install_result='already_installed'
		eval $__resultvar="'$install_result'"
	else
		print_warning "The $2 command is required but is not installed."

		while true; do
			read -p "Do you wish to install $1 automatically now?(Y/N)" yn
			case $yn in
				[Yy]* )
					print_text "Installing NPM package $1"
					sudo npm install "$1" -gd
					local install_result='newly_installed'
					eval $__resultvar="'$install_result'"
					break;;
				[Nn]* ) tput sgr0; exit;;
				* ) echo "Please answer yes or no.";;
			esac
		done;
	fi
	
}


function install_nodejs {
	require_command_from_repo "nodejs" "nodejs" "ppa:chris-lea/node.js" result
	if [ ! -f "/usr/bin/node" ]; then
		print_info "Symlinking /usr/bin/nodejs to /usr/bin/node"
		sudo ln -s /usr/bin/nodejs /usr/bin/node
	fi	
	require_command "npm" "npm" result
}

function print_success {
	tput setaf 2
	echo -e $1
	tput sgr0
}

function print_info {
	tput setaf 4
	echo $1
	tput sgr0
}

function print_warning {
	tput setaf 3
	echo $1
	tput sgr0
}

function print_error {
	tput setaf 1
	echo $1
	tput sgr0
}

function print_text {
	tput sgr0
	echo $1	
}

print_success "Installing required components...\n\n"

require_command "add-apt-repository" "python-software-properties" result

install_nodejs

require_command "git" "git" result

install_leap_motion

require_command "xdotool" "xdotool" result

print_success "\n\nInstallation complete."

print_text "Hit ENTER to continue..."

read