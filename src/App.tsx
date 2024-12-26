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
    const { canceled } = await window.electronAPI.openFile();
    setLoading(false);
    if (canceled) return;
  };
  const processMobileVideo = async () => {};
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <GlobalStyle />
      <Layout.Header />
      <Content>
        <Space direction="vertical" size="large">
          <Button type="primary" onClick={selectDesktopVideo} loading={loading}>
            Select Desktop Video
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
