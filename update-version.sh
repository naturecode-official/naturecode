#!/bin/bash

# 更新 NatureCode 版本号到 1.4.5.4
echo "正在更新版本号到 1.4.5.4..."

# 更新所有文件中的版本号
OLD_VERSION="1.4.5.2"
NEW_VERSION="1.4.5.4"

# 1. 更新 package.json (已手动更新)
echo " package.json 已更新"

# 2. 更新 src/cli/index.js (已手动更新)
echo " src/cli/index.js 已更新"

# 3. 更新 install-smart.sh
echo "更新 install-smart.sh..."
sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" install-smart.sh

# 4. 更新 install-simple.sh
if [ -f "install-simple.sh" ]; then
    echo "更新 install-simple.sh..."
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" install-simple.sh
fi

# 5. 更新 install.sh
if [ -f "install.sh" ]; then
    echo "更新 install.sh..."
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" install.sh
fi

# 6. 更新 install-universal.sh
if [ -f "install-universal.sh" ]; then
    echo "更新 install-universal.sh..."
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" install-universal.sh
fi

# 7. 更新 install-now.sh
if [ -f "install-now.sh" ]; then
    echo "更新 install-now.sh..."
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" install-now.sh
fi

# 8. 更新 install-no-color.sh
if [ -f "install-no-color.sh" ]; then
    echo "更新 install-no-color.sh..."
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" install-no-color.sh
fi

# 9. 更新 VERSION 文件
if [ -f "VERSION" ]; then
    echo "更新 VERSION 文件..."
    echo "$NEW_VERSION" > VERSION
fi

# 10. 更新文档中的版本号
echo "更新文档中的版本号..."

# whatisthis.md
if [ -f "whatisthis.md" ]; then
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" whatisthis.md
fi

# README.md
if [ -f "README.md" ]; then
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" README.md
fi

# README_INSTALL.md
if [ -f "README_INSTALL.md" ]; then
    sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" README_INSTALL.md
fi

# 其他可能包含版本号的文件
for file in *.md; do
    if [ -f "$file" ]; then
        sed -i '' "s/$OLD_VERSION/$NEW_VERSION/g" "$file"
    fi
done

echo ""
echo " 版本号更新完成！"
echo "旧版本: $OLD_VERSION"
echo "新版本: $NEW_VERSION"
echo ""
echo "验证更新:"
grep -r "$NEW_VERSION" --include="*.js" --include="*.sh" --include="*.md" --include="*.json" . | head -10