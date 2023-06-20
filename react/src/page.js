import { useState } from 'react';
import {
  create_rapid_link,
  convert_rapid_link,
  type_name_translate,
} from './core';
import {
  Container,
  Col,
  Row,
  Card,
  Button,
  Form,
  Table,
} from 'react-bootstrap';
import './page.css';


export default function Main(props) {
  const [ready,setReady] = useState(false);
  const [data,setData] = useState(null);
  
  async function copyToClipboard(textToCopy) {
    // https://stackoverflow.com/a/65996386
    
    // navigator clipboard api needs a secure context (https)
    if (navigator.clipboard && window.isSecureContext) {
      // navigator clipboard api method
      return navigator.clipboard.writeText(textToCopy);
    }
    // without secure context (http)
    //! Feb 1, 2021
    //! this method is deprecated and may not function in the future
    else {
      // text area method
      let textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      // make the textarea out of viewport
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999); // For mobile devices
      return new Promise((res, rej) => {
        // here the magic happens
        document.execCommand('copy') ? res() : rej();
        textArea.remove();
      });
    }
  }
  
  async function do_copy(event) {
    event.preventDefault();
    let txt = document.querySelector('.copied-display');
    txt.style.display = 'block';
    txt.style.animation = null;
    
    let id = event.target.parentNode.getAttribute('id');
    let tr = document.querySelector(`tr[id="${id}"]`);
    let link = tr.childNodes[1].innerHTML;
    
    await copyToClipboard(link);
    
    txt.style.animation = "fade-out 1.75s forwards";
  }
  
  async function do_create(event) {
    await setReady(false);
    event.preventDefault();
    let file_elem = document.querySelector(".create-form-file");
    let prompt = document.querySelector('.create-err-prompt');
    
    // did not upload file
    if (file_elem.files.length == 0) {
      prompt.style.display = 'block';
      return;
    }
    prompt.style.display = 'none';
    
    let file_obj = file_elem.files[0];
    let select = document.querySelector(".create-form-type");
    let linktype = [];
    for (let opt of select.options) {
      if (opt.selected) {
        linktype.push(opt.value);
      }
    }
    
    let reader = new FileReader();
    reader.onload = () => {
      var file_bytes = new Uint8Array(reader.result);
      
      create_rapid_link(file_obj, file_bytes, linktype)
      .then((result) => {
        // render result
        let output = Array();
        let idx = 1;
        for (let res of result) {
          output.push(
            <tr id={idx} key={idx} onClick={do_copy}>
              <td>{type_name_translate(res.type)}</td>
              <td>{res.link}</td>
            </tr>
          );
          idx += 1;
        }
        setData(output);
        setReady(true);
      });
      
    }
    await reader.readAsArrayBuffer(file_obj)
  }
  
  async function do_convert(event) {
    await setReady(false);
    event.preventDefault();
    let link = document.querySelector(".convert-form-txt").value;
    let prompt = document.querySelector('.convert-err-prompt');
    
    // did not upload file
    if (link.length == 0) {
      prompt.style.display = 'block';
      return;
    }
    prompt.style.display = 'none';
    
    let select = document.querySelector(".convert-form-type");
    let linktype = [];
    for (let opt of select.options) {
      if (opt.selected) {
        linktype.push(opt.value);
      }
    }
    
    convert_rapid_link(link, linktype)
    .then((result) => {
      // render result
      let output = Array();
      let idx = 1;
      for (let res of result) {
        output.push(
          <tr id={idx} key={idx} onClick={do_copy}>
            <td>{type_name_translate(res.type)}</td>
            <td>{res.link}</td>
          </tr>
        );
        idx += 1;
      }
      setData(output);
      setReady(true);
    }).catch((err) => {
      console.error(err);
      
      let prompt = document.querySelector('.convert-err-prompt');
      prompt.innerHTML = err;
      prompt.style.display = 'block';
      return;
    });
  }
  
  return (
    <Container>
      
      <h1 className="text-center py-3">计算百度云秒传链接, 或者在几类不同的链接之间转换。</h1>
      <Row className="py-2">
        
        <Col className="create">
          <Card>
            <Card.Body>
              <Card.Title className="create-err-prompt" style={{display:'none',color:'red',fontWeight:'bolder'}}>
                请先选择一个文件
              </Card.Title>
              <Card.Title>计算链接</Card.Title>
              <Form className="convert-form" onSubmit={do_create}>
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>选择文件</Form.Label>
                  <Form.Control className="create-form-file" type="file" />
                </Form.Group>
                <Form.Group controlId="formSelect" className="mb-3">
                  <Form.Label>链接类型</Form.Label>
                  <Form.Control as="select" className="create-form-type" defaultValue={["rapid-upload-link"]} multiple>
                    <option value="rapid-upload-link">秒传标准码长链(梦姬)</option>
                    <option value="rapid-upload-link-short">秒传标准码短链</option>
                    <option value="baidupcs-go">BaiduPCS-Go</option>
                    <option value="pandownload">PanDownload</option>
                  </Form.Control>
                </Form.Group>
                <Button variant="success" className="create-form-submit" type="submit">计算</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col className="convert">
          <Card>
            <Card.Body>
              <Card.Title className="convert-err-prompt" style={{display:'none',color:'red',fontWeight:'bolder'}}>
                请先输入一条链接
              </Card.Title>
              <Card.Title>转换链接</Card.Title>
              <Form className="convert-form" onSubmit={do_convert}>
                <Form.Group controlId="formInput" className="mb-3">
                  <Form.Label>输入链接</Form.Label>
                  <Form.Control as="input" className="convert-form-txt" type="input" />
                </Form.Group>
                <Form.Group controlId="formSelect" className="mb-3">
                  <Form.Label>链接类型</Form.Label>
                  <Form.Control as="select" className="convert-form-type" defaultValue={["rapid-upload-link"]} multiple>
                    <option value="rapid-upload-link">秒传标准码长链(梦姬)</option>
                    <option value="baidupcs-go">BaiduPCS-Go</option>
                    <option value="pandownload">PanDownload</option>
                  </Form.Control>
                </Form.Group>
                <Button variant="success" className="convert-form-submit" type="submit">转换</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
      </Row>
      
      <Row className="result py-2">
        <h1>结果</h1>
        <span
        style={{
          display:'none',
          color:'green',
          fontWeight:'bolder',
          fontSize:'xx-large'
        }}
        className='copied-display fadeout align-self-center px-4'
        >
          Copied!
        </span>
        <Table className="result-table" striped bordered responsive hover>
          <thead>
            <tr key="0">
              <td style={{width: '125px'}}>链接类型</td>
              <td>链接</td>
            </tr>
          </thead>
          <tbody className="result-tbody">
            {ready && data ? data : null}
          </tbody>
        </Table>
      </Row>
      
    </Container>
  );
}
