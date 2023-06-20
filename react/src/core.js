const md5 = require('js-md5');
const Base64 = require('js-base64');


async function calc_file_info(file_obj, file_bytes) {
  let file_name = file_obj.name;
  let file_len = file_obj.size;
  let file_md5 = await md5(file_bytes).toUpperCase();
  // 文件前256KB的MD5
  // 如果文件小于256KB, 则计算整个文件的MD5
  let file_slice_md5 = await md5(file_bytes.slice(0, Math.min(file_len,262144))).toUpperCase();
  
  return {
    'file_name':file_name,
    'file_len':file_len,
    'file_md5':file_md5,
    'file_slice_md5':file_slice_md5,
  };
}

async function build_rapid_link(link_type, data) {
  switch (link_type) {
    case 'baidupcs-go':
      return `BaiduPCS-Go rapidupload -length=${data.file_len} -md5=${data.file_md5} -slicemd5=${data.file_slice_md5} "${data.file_name}"`;
    case 'pandownload':
      let tmp = `${data.file_name}|${data.file_len}|${data.file_md5}|${data.file_slice_md5}`;
      return `bdpan://${Base64.encode(tmp)}`;
    case 'rapid-upload-link':
      return `${data.file_md5}#${data.file_slice_md5}#${data.file_len}#${data.file_name}`;
    case 'rapid-upload-link-short':
      return `${data.file_md5}#${data.file_len}#${data.file_name}`;
    default:
      return null;
  }
}

export function type_name_translate(type) {
  switch (type) {
    case 'baidupcs-go':
      return 'BaiduPCS-Go';
    case 'pandownload':
      return 'PanDownload';
    case 'rapid-upload-link':
      return '秒传标准码长链(梦姬)';
    case 'rapid-upload-link-short':
      return '秒传标准码短链';
    default:
      return null;
  }
}

export async function create_rapid_link(file_obj, file_bytes, link_type) {
  let result = await calc_file_info(file_obj, file_bytes);
  
  let output = []
  for (let type of link_type) {
    output.push({
      'type':type,
      'link':await build_rapid_link(type, result)
    });
  }
  
  return output;
}

const RAPID_LINK_PATTERN = {
  'baidupcs-go': /BaiduPCS-Go rapidupload -length=(\d+) -md5=([a-fA-F0-9]{32}) -slicemd5=([a-fA-F0-9]{32}) "(.*)"/,
  'pandownload': /bdpan\:\/\/(.*)/,
  'rapid-upload-link': /([a-fA-F0-9]{32})#([a-fA-F0-9]{32})#(\d+)#(.*)/
};

export async function convert_rapid_link(link, target_type) {
  let file_info = null;
  for (let link_type in RAPID_LINK_PATTERN) {
    let pattern = RAPID_LINK_PATTERN[link_type];
    let match = link.match(pattern);
    if (match) {
      switch (link_type) {
      case 'baidupcs-go':
        file_info = {
          'file_len':match[1],
          'file_md5':match[2],
          'file_slice_md5':match[3],
          'file_name':match[4],
        };
        break;
      case 'pandownload':
        let tmp = Base64.decode(match[1]);
        let match_inside = tmp.match(/(.*)\|(\d+)\|([a-fA-F0-9]{32})\|([a-fA-F0-9]{32})/);
        file_info = {
          'file_name':match_inside[1],
          'file_len':match_inside[2],
          'file_md5':match_inside[3],
          'file_slice_md5':match_inside[4],
        };
        break;
      case 'rapid-upload-link':
        file_info = {
          'file_md5':match[1],
          'file_slice_md5':match[2],
          'file_len':match[3],
          'file_name':match[4],
        };
        break;
      default:
        throw Error('输入的链接必须为: 秒传标准码长链(梦姬), BaiduPCS-Go, 或者PanDownload 链接');
      }
      break;
    }
  }
  if (file_info === null) {
    throw Error('输入的链接必须为: 秒传标准码长链(梦姬), BaiduPCS-Go, 或者PanDownload 链接');
  }
  
  let output = [];
  for (let type of target_type) {
    output.push({
      'type':type,
      'link':await build_rapid_link(type, file_info)
    });
  }
  
  return output;
}

