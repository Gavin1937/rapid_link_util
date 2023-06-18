
# rapid_link_util

计算本地文件的百度云秒传链接, 或者在几类不同的链接之间转换。

**请注意: 本工具不会连接百度云的服务器, 单纯是通过文件MD5去计算文件的秒传链接。**

**你需要先将文件上传到百度云, 这些链接才能生效。**

**这个工具也无法让一个失效链接变得有效。**

**(2023.06.01) 现在秒传已经停止维护了, 这个工具所支持的链接类型在未来也可能会失效。**

## 支持的链接种类

* BaiduPCS-Go
  * 类型名字: `baidupcs-go`
  * 例子: `BaiduPCS-Go rapidupload -length=1871135 -md5=3DA0828AF220120B53159D0FDD18FFFB -slicemd5=1FA85F7D75CADCBB576552340B566EFB "archive.zip"`

* PanDownload
  * 类型名字: `pandownload`
  * 例子: `bdpan://YXJjaGl2ZS56aXB8MTg3MTEzNXwzREEwODI4QUYyMjAxMjBCNTMxNTlEMEZERDE4RkZGQnwxRkE4NUY3RDc1Q0FEQ0JCNTc2NTUyMzQwQjU2NkVGQg==`

* 秒传标准码长链(梦姬)
  * 类型名字: `rapid-upload-link`
  * 例子: `3DA0828AF220120B53159D0FDD18FFFB#1FA85F7D75CADCBB576552340B566EFB#1871135#archive.zip`

* 秒传标准码短链
  * 类型名字: `rapid-upload-link-short`
  * 例子: `3DA0828AF220120B53159D0FDD18FFFB#1871135#archive.zip`

## 工具

* python: python 写的脚本工具

