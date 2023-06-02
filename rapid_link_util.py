#!/usr/bin/env python

import re
from sys import argv
from pathlib import Path
from hashlib import md5
from base64 import b64decode, b64encode
from typing import Union


HELP_MESSAGE = '''
rapid_link_util
    - 作者: Gavin1937
    - 版本: 2023.06.01.v01

本脚本可以计算一个文件的百度云秒传链接, 或者在几类不同的链接之间转换。

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
'''

def calc_file_info(file_path:Path) -> dict:
    '''
    计算文件的基础信息, 包括:
    
    文件名字, 文件长度, 文件MD5, 文件前256KB的MD5
    
    return: {
        'file_name':'文件名字',
        'file_len':'文件长度',
        'file_md5':'文件MD5',
        'file_slice_md5':'文件前256KB的MD5'
    }
    '''
    
    with open(file_path, 'rb') as file:
        raw = file.read()
    
    file_name = file_path.name
    file_len = len(raw)
    file_md5 = md5(raw).hexdigest().upper()
    # 文件前256KB的MD5
    # 如果文件小于256KB, 则计算整个文件的MD5
    file_slice_md5 = md5(raw[:min(file_len,262144)]).hexdigest().upper()
    
    return {
        'file_name':file_name,
        'file_len':file_len,
        'file_md5':file_md5,
        'file_slice_md5':file_slice_md5,
    }


RAPID_LINK_NAMES = {
    'baidupcs-go': 'BaiduPCS-Go',
    'pandownload': 'PanDownload',
    'rapid-upload-link': '秒传标准码长链(梦姬)',
    'rapid-upload-link-short': '秒传标准码短链',
}

RAPID_LINK_TEMPLATES = {
    'baidupcs-go': 'BaiduPCS-Go rapidupload -length={file_len} -md5={file_md5} -slicemd5={file_slice_md5} "{file_name}"',
    'pandownload': '{file_name}|{file_len}|{file_md5}|{file_slice_md5}',
    'rapid-upload-link': '{file_md5}#{file_slice_md5}#{file_len}#{file_name}',
    'rapid-upload-link-short': '{file_md5}#{file_len}#{file_name}',
}

def create_rapid_link(path:Union[str,Path], link_type:Union[str,list]) -> list:
    '''
    计算文件秒传链接, 通过计算文件MD5去生成秒传链接。
    
    Parameter:
    ----------
        - path          => str|Path, 要计算的文件或文件夹路径, 如果是文件夹, 本函数会计算文件夹下所有的文件
        - link_type     => str|list, 生成链接的类型
    
    支持的链接类型:
    --------
        - BaiduPCS-Go          => baidupcs-go
        - PanDownload          => pandownload
        - 秒传标准码长链(梦姬)   => rapid-upload-link
        - 秒传标准码短链        => rapid-upload-link-short
    '''
    
    path = Path(path)
    if not path.exists():
        raise ValueError(f'文件路径不存在: {path}')
    
    files_to_handle = []
    if path.is_dir():
        files_to_handle = [f for f in path.rglob('*') if f.is_file()]
    elif path.is_file():
        files_to_handle = [path]
    
    link_templates = []
    if isinstance(link_type, str):
        link_type = link_type.lower()
        if link_type not in RAPID_LINK_TEMPLATES:
            raise ValueError(f'链接种类不存在: {link_type}')
        link_templates.append((link_type,RAPID_LINK_TEMPLATES[link_type]))
    elif isinstance(link_type, list):
        for _type in link_type:
            _type = _type.lower()
            if _type not in RAPID_LINK_TEMPLATES:
                raise ValueError(f'链接种类不存在: {_type}')
            link_templates.append((_type,RAPID_LINK_TEMPLATES[_type]))
    
    # create links from templates
    for file in files_to_handle:
        print(file.name)
        file_info = calc_file_info(file)
        for _type,template in link_templates:
            final_link = template.format(**file_info)
            if _type == 'pandownload':
                final_link = 'bdpan://' + b64encode(final_link.encode('utf-8')).decode('utf-8')
            print(f'类型: {RAPID_LINK_NAMES[_type]}, 链接: {final_link}')
        print('\n')


RAPID_LINK_PATTERN = {
    r'BaiduPCS-Go rapidupload -length=(\d+) -md5=([a-fA-F0-9]{32}) -slicemd5=([a-fA-F0-9]{32}) "(.*)"': 'baidupcs-go',
    r'bdpan\:\/\/(.*)': 'pandownload',
    r'([a-fA-F0-9]{32})#([a-fA-F0-9]{32})#(\d+)#(.*)': 'rapid-upload-link',
}

def convert_rapid_link(link:str, target_type:Union[str,list]) -> str:
    '''
    转换秒传链接。
    
    Parameter:
    ----------
        - link          => str, 秒传链接, 本函数不支持从秒传标准码短链转换到其他链接
        - target_type   => str|list, 要转换的秒传链接类型
    
    支持的链接类型:
    --------
        - BaiduPCS-Go          => baidupcs-go
        - PanDownload          => pandownload
        - 秒传标准码长链(梦姬)   => rapid-upload-link
    '''
    
    # detect input link & extract file_info
    link_type = None
    file_info = None
    for pattern, _type in RAPID_LINK_PATTERN.items():
        match = re.search(pattern, link)
        if match:
            link_type = _type
            if link_type == 'baidupcs-go':
                file_info = {
                    'file_len':match.group(1),
                    'file_md5':match.group(2),
                    'file_slice_md5':match.group(3),
                    'file_name':match.group(4),
                }
            elif link_type == 'pandownload':
                link = b64decode(match.group(1).encode('utf-8')).decode('utf-8')
                match_inside = re.search(r'(.*)\|(\d+)\|([a-fA-F0-9]{32})\|([a-fA-F0-9]{32})', link)
                file_info = {
                    'file_name':match_inside.group(1),
                    'file_len':match_inside.group(2),
                    'file_md5':match_inside.group(3),
                    'file_slice_md5':match_inside.group(4),
                }
            elif link_type == 'rapid-upload-link':
                file_info = {
                    'file_md5':match.group(1),
                    'file_slice_md5':match.group(2),
                    'file_len':match.group(3),
                    'file_name':match.group(4),
                }
            break
    if file_info is None:
        raise ValueError(f'无法识别链接种类, 本函数不支持从秒传标准码短链转换到其他链接: {link}')
    
    # get target_template
    target_templates = []
    if isinstance(target_type, str):
        target_type = target_type.lower()
        if target_type not in RAPID_LINK_TEMPLATES:
            raise ValueError(f'链接种类不存在: {target_type}')
        target_templates.append((target_type,RAPID_LINK_TEMPLATES[target_type]))
    elif isinstance(target_type, list):
        for _type in target_type:
            _type = _type.lower()
            if _type not in RAPID_LINK_TEMPLATES:
                raise ValueError(f'链接种类不存在: {_type}')
            target_templates.append((_type,RAPID_LINK_TEMPLATES[_type]))
    
    # create links from templates
    for _type,template in target_templates:
        final_link = template.format(**file_info)
        if _type == 'pandownload':
            final_link = 'bdpan://' + b64encode(final_link.encode('utf-8')).decode('utf-8')
        print(f'类型: {RAPID_LINK_NAMES[_type]}, 链接: {final_link}')


def print_help():
    print(HELP_MESSAGE)

if __name__ == '__main__':
    try:
        
        if len(argv) <= 1 or argv[1] == '-h' or argv[1] == '--help' or argv[1] == 'help':
            print_help()
            exit(1)
        
        if len(argv) < 3:
            raise ValueError('参数过少。')
        
        if argv[1] == 'create':
            path = argv[2]
            link_type = argv[3:]
            create_rapid_link(path, link_type)
        elif argv[1] == 'convert':
            link = argv[2]
            target_type = argv[3:]
            convert_rapid_link(link, target_type)
        
    except KeyboardInterrupt:
        print()
        exit(-1)
    except Exception as err:
        print(f'Exception: {err}')
