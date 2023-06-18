
rapid_link_util python script
    - 作者: Gavin1937
    - 版本: 2023.06.01.v01

本脚本可以计算本地文件的百度云秒传链接, 或者在几类不同的链接之间转换。

请注意: 本脚本不会连接百度云的服务器, 单纯是通过文件MD5去计算文件的秒传链接。
你需要先将文件上传到百度云, 这些链接才能生效。
这个脚本也无法让一个失效链接变得有效。

(2023.06.01)
现在秒传已经停止维护了, 这个脚本所支持的链接类型在未来也可能会失效。

支持的链接种类
    BaiduPCS-Go
        类型名字: baidupcs-go
        例子: BaiduPCS-Go rapidupload -length=1871135 -md5=3DA0828AF220120B53159D0FDD18FFFB -slicemd5=1FA85F7D75CADCBB576552340B566EFB "archive.zip"
    
    PanDownload
        类型名字: pandownload
        例子: bdpan://YXJjaGl2ZS56aXB8MTg3MTEzNXwzREEwODI4QUYyMjAxMjBCNTMxNTlEMEZERDE4RkZGQnwxRkE4NUY3RDc1Q0FEQ0JCNTc2NTUyMzQwQjU2NkVGQg==
    
    秒传标准码长链(梦姬)
        类型名字: rapid-upload-link
        例子: 3DA0828AF220120B53159D0FDD18FFFB#1FA85F7D75CADCBB576552340B566EFB#1871135#archive.zip
    
    秒传标准码短链
        类型名字: rapid-upload-link-short
        例子: 3DA0828AF220120B53159D0FDD18FFFB#1871135#archive.zip

需要 Python >= 3.8   

使用方法
    python rapid_link_util.py [create|convert] ARG
    
    create path link_type...
        计算文件秒传链接, 通过计算文件MD5去生成秒传链接。
        
        path          => 要计算的文件或文件夹路径, 如果是文件夹, 本函数会计算文件夹下所有的文件
        link_type     => 一个或多个生成链接的类型
    
    convert link target_type...
        转换秒传链接。
        
        link          => 需要转换的链接, 本函数不支持从秒传标准码短链转换到其他链接
        target_type   => 一个或多个要转换的秒传链接类型

使用例子
    计算文件 "file.txt" 的秒传标准码长链(梦姬)
        python rapid_link_util.py create file.txt rapid-upload-link
    
    计算文件夹 "data" 下面的所有文件的秒传标准码长链(梦姬) 和 PanDownload 链接
        python rapid_link_util.py create file.txt rapid-upload-link pandownload
    
    将一个 秒传标准码长链(梦姬) 链接转换成 BaiduPCS-Go. PanDownload. 秒传标准码长链(梦姬), 和 秒传标准码短链 链接
        python rapid_link_util.py convert "3DA0828AF220120B53159D0FDD18FFFB#1FA85F7D75CADCBB576552340B566EFB#1871135#archive.zip" baidupcs-go pandownload rapid-upload-link rapid-upload-link-short
