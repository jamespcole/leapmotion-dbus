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


function install_leapmotion_dbus_service {

	if [ ! -d "/etc/leapmotion-dbus" ]; then
		sudo mkdir -p /etc/leapmotion-dbus
		print_info "Downloading from git..."
		sudo git clone https://github.com/jamespcole/leapmotion-dbus.git /etc/leapmotion-dbus
	else
		print_info "Stopping leapmotion-dbus service..."
		sudo /etc/init.d/leapmotion-dbus stop
		print_info "Downloading latest from git..."
		(cd /etc/leapmotion-dbus && sudo git pull origin master)
	fi
	
	if [ ! -f "/etc/init.d/leapmotion-dbus" ]; then
		print_info "Installing init script..."
		#sudo cp -f /etc/leapmotion-dbus/scripts/leapmotion-dbus.conf /etc/init/leapmotion-dbus.conf
		sudo cp -f /etc/leapmotion-dbus/scripts/leapmotion-dbus /etc/init.d/
		sudo chmod a+x /etc/init.d/leapmotion-dbus
		sudo update-rc.d -f leapmotion-dbus remove
		sudo update-rc.d leapmotion-dbus start 20 5 . stop 20 0 1 6 .
	fi	
}

install_dir=~/.local/share/leapmotion-dbus	
function install_leapmotion_dbus {
	
	if [ ! -d "$install_dir" ]; then
		print_info "Installing leapmotion-dbus to $install_dir"
		mkdir -p "$install_dir"
		print_info "Downloading from git..."
		git clone https://github.com/jamespcole/leapmotion-dbus.git "$install_dir"
	else
		print_info "Updating leapmotion-dbus..."
		print_info "Killing already running processes..."
		kill $(ps ux -u $USER -U $USER | grep '[g]estures.js' | awk '{print $2}') > /dev/null 2>&1
		print_info "Downloading latest from git..."
		(cd "$install_dir" && git pull origin master)
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

function checkCommandExists {
	local __resultvar=$2
	
	if command -v $1 >/dev/null 2>&1; then
		local install_result='true'
		eval $__resultvar="'$install_result'"
	else
		local install_result='false'
		eval $__resultvar="'$install_result'"
	fi
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

if [ $1 = 'prereqs_check' ]; then

	checkCommandExists "node" result
	if [ $result = 'false' ]; then
		exit 1
	fi

	checkCommandExists "leapd" result
	if [ $result = 'false' ]; then
		exit 1
	fi

	checkCommandExists "git" result
	if [ $result = 'false' ]; then
		exit 1
	fi

	checkCommandExists "xdotool" result
	if [ $result = 'false' ]; then
		exit 1
	fi

	if [ ! -f "$install_dir/gestures.js" ]; then
		exit 1
	fi	

	# checkCommandExists "notReal" result
	# if [ $result = 'false' ]; then
	# 	exit 1
	# fi

	exit 0
elif [ $1 = 'update_check' ]; then

	if [ ! -d "$install_dir" ]; then
		exit 0
	fi

	cd "$install_dir"

	git fetch > /dev/null 2>&1

	DIFF_COUNT=$(git rev-list HEAD...origin/master --count @)

	exit $DIFF_COUNT
elif [ $1 = 'install_updates' ]; then

	if [ ! -d "$install_dir" ]; then
		exit 1
	fi

	cd "$install_dir"

	GIT_RESULT=$(git pull origin master)

	exit 0
elif [ $1 = 'start_service' ]; then

	if [ ! -f "$install_dir/gestures.js" ]; then
		exit 1
	fi

	process_count=$(ps ux -u $USER -U $USER | grep '[g]estures.js' | wc -l)	
	if [ $process_count -eq 0 ]; then
		cd "$install_dir"
		node "$install_dir/gestures.js"  
	fi

	exit 0
elif [ $1 = 'stop_service' ]; then

	if [ ! -f "$install_dir/gestures.js" ]; then
		exit 1
	fi
	
	process_count=$(ps ux -u $USER -U $USER | grep '[g]estures.js' | wc -l)	
	if [ $process_count -ne 0 ]; then		
		kill $(ps ux -u $USER -U $USER | grep '[g]estures.js' | awk '{print $2}') > /dev/null 2>&1
	fi

	exit 0
elif [ $1 = 'service_running' ]; then

	if [ ! -f "$install_dir/gestures.js" ]; then
		exit 1
	fi
	
	process_count=$(ps ux -u $USER -U $USER | grep '[g]estures.js' | wc -l)	
	if [ $process_count -ne 0 ]; then
		exit 0
	fi

	exit 1
elif [ $1 = 'install_reqs' ]; then
	print_success "Installing required components...\n\n"

	require_command "add-apt-repository" "python-software-properties" result

	install_nodejs

	require_command "git" "git" result

	install_leap_motion

	require_command "xdotool" "xdotool" result

	#install_global_npm_package "forever" "forever" result

	#install_leapmotion_dbus_service

	#print_info "Restarting leapmotion-dbus service..."

	#sudo /etc/init.d/leapmotion-dbus restart

	install_leapmotion_dbus	

	print_success "\n\nInstallation complete."

	print_text "Hit ENTER to continue..."

	read

	exit 0
elif [ $1 = 'installation_pids' ]; then
	install_pids=$(ps aux | grep 'jamespcole.gmail.com/[h]elpers.sh install_reqs' | sed -n 1p | awk '{printf $2}')
	echo $install_pids
	exit $install_pids
elif [ $1 = 'install_running' ]; then
	process_count=$(ps ux -u $USER -U $USER | grep '[h]elpers.sh install_reqs' | wc -l)	
	if [ $process_count -ne 0 ]; then
		exit 0
	fi

	exit 1
else
	exit 1
fi