import { Button, Form, Input, Layout, Space } from 'antd';
import styled, { createGlobalStyle } from 'styled-components';
import { useState } from 'react';

const GlobalStyle = createGlobalStyle`
body {
  margin: 0;
  padding: 0;
}
`;

const Content = styled(Layout.Content)`
  padding: 24px;
`;

export const App = () => {
  const [loading, setLoading] = useState(false);
  const selectDesktopVideo = async () => {
    setLoading(true);
    const { canceled, filePath } = await window.electronAPI.openFile();
    if (canceled || !filePath) return setLoading(false);
    const res = await window.electronAPI.processDesktopFile(filePath);
    console.log('res', res)
    setLoading(false);
  };
  const processMobileVideo = async () => {};
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <GlobalStyle />
      <Layout.Header />
      <Content>
        <Space direction="vertical" size="large">
          <Button type="primary" onClick={selectDesktopVideo} loading={loading}>
            Process Desktop Video
          </Button>
          <Form onFinish={processMobileVideo}>
            <Form.Item label="Mobile Video" name="mobileVideo">
              <Input type="file" />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Process Mobile Video
            </Button>
          </Form>
        </Space>
      </Content>
    </Layout>
  );
};
