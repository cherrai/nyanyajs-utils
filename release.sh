#! /bin/bash
name="nyanyajs-utils"
port=23200
branch="main"
# configFilePath="config.dev.json"
configFilePath="config.pro.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("pub pub2 start ")

# yarn add @nyanyajs/utils @saki-ui/core  --registry https://registry.npm.aiiko.club
start() {
	echo "-> 正在启动「${name}」服务"

	cd ./src/webAssembly/go-wasm
	./release.sh build
	cd ../../..
	yarn pub
}

pub() {
	# 1. 健壮性检查：确保当前目录下有 package.json
	if [ ! -f "package.json" ]; then
		echo -e "\033[31m❌ 错误：当前目录未找到 package.json，请在项目根目录下运行。\033[0m"
		return 1
	fi

	# 2. 自动提取 package.json 里的 version 字段值
	local VERSION=$(node -e "console.log(require('./package.json').version)")

	if [ -z "$VERSION" ] || [ "$VERSION" = "undefined" ]; then
		echo -e "\033[31m❌ 错误：无法解析 package.json 中的 version 版本号。\033[0m"
		return 1
	fi

	local TAG="v$VERSION"
	local PKG_NAME="nyanyajs-utils"
	local TAR_FILE="${PKG_NAME}.tar.gz"

	echo -e "\033[32m🚀 开始发布流程，目标版本: ${TAG} ...\033[0m"

	# 3. 检查本地是否有未提交的代码，顺便提醒你推源码
	if ! git diff-index --quiet HEAD --; then
		echo -e "\033[33m⚠️ 警告：本地有未提交的代码，建议先 commit 源码。\033[0m"
	fi

	# 4. 执行本地完美编译
	echo "📦 正在执行本地构建..."
	if ! yarn build; then
		echo -e "\033[31m❌ 编译失败，终止发布。\033[0m"
		return 1
	fi

	# 5. 创建本地 Git Tag 并推送到远程 (如果 tag 已存在会跳过)
	echo "🏷️  正在处理 Git Tag..."
	if ! git rev-parse "$TAG" >/dev/null 2>&1; then
		git tag "$TAG"
		git push origin "$TAG"
	else
		echo "💡 Tag ${TAG} 已存在，尝试直接关联或覆盖 Release..."
	fi

	# 6. 打包 dist 产物
	echo "🗜️  正在打包编译产物..."
	tar -czf "$TAR_FILE" dist package.json README.md

	# 7. 核心：调用 gh 命令行工具创建 Release 并上传压缩包
	echo "🛰️  正在通过 gh 往 GitHub 冲锋..."
	if gh release create "$TAG" "./$TAR_FILE" --title "$TAG" --notes "Automated release via pub()"; then
		echo -e "\033[32m\n🎉 发布成功！\033[0m"
		echo -e "主项目配置更新地址："
		echo -e "\033[36m\"@nyanyajs/utils\": \"https://github.com/cherrai/nyanyajs-utils/releases/download/${TAG}/${TAR_FILE}\"\033[0m\n"
	else
		echo -e "\033[31m❌ gh release 创建失败。\033[0m"
	fi

	# 8. 卸磨杀驴，清理本地临时压缩包
	rm -f "$TAR_FILE"
}

main() {
	if echo "${allowMethods[@]}" | grep -wq "$1"; then
		"$1"
	else
		echo "Invalid command: $1"
	fi
}

main "$1"
