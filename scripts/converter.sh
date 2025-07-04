#!/bin/bash

# git remote -v                                                    
# origin  git@192.168.1.21:webox/tools.git (fetch)
# origin  git@192.168.1.21:webox/tools.git (push)
# 可以把 上面的信息 转换成 url 的形式 192.168.1.21/webox/tools

convert_to_url() {
		local remote_info="$1"
		
		# 提取远程名称和 URL 部分
		local remote_name=$(echo "$remote_info" | awk '{print $1}')
		local remote_url=$(echo "$remote_info" | awk '{print $2}')
		
		# 检查 URL 是否包含 "git@"，如果是，则转换为 URL 格式, 去除.git后缀
		if [[ "$remote_url" == git@* ]]; then
			# 提取主机名和路径
			local host_path=$(echo "$remote_url" | sed 's/git@//; s/:/\//; s/\.git$//')
			# 将主机名和路径组合成 URL 格式
			remote_url="$host_path"
		fi
		
		# 输出转换后的结果
		echo "$remote_url"
}

convert_git_remote_to_url() {
	# 获取 git remote -v 信息
	local remote_info=$(git remote -v | head -n 1)
	
	# 调用转换函数
	convert_to_url "$remote_info"
}
