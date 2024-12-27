import { Button, Layout, Space } from 'antd';
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
  const [outputPath, setOutputPath] = useState<string>();
  const [loading, setLoading] = useState(false);

  const selectOutputPath = async () => {
    const { canceled, path } = await window.electronAPI.openDirectory();
    if (!canceled && path) return setOutputPath(path);
  };

  const selectDesktopVideo = async () => {
    setLoading(true);
    const { canceled, filePath } = await window.electronAPI.openFile();
    if (canceled || !filePath) return setLoading(false);
    await window.electronAPI.processDesktopFile(filePath, outputPath);
    setLoading(false);
  };

  const processMobileVideo = async () => {
    setLoading(true);
    const { canceled, filePath } = await window.electronAPI.openFile();
    if (canceled || !filePath) return setLoading(false);
    await window.electronAPI.processMobileFile(filePath, outputPath);
    setLoading(false);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <GlobalStyle />
      <Layout.Header />
      <Content>
        <Space direction="vertical" size="large">
          <Button type="primary" onClick={selectOutputPath}>
            Select Output Path
          </Button>
          <Button
            type="primary"
            onClick={selectDesktopVideo}
            loading={loading}
            disabled={!outputPath}
          >
            Process Desktop Video
          </Button>
          <Button
            type="primary"
            onClick={processMobileVideo}
            loading={loading}
            disabled={!outputPath}
          >
            Process Mobile Video
          </Button>
        </Space>
      </Content>
    </Layout>
  );
};
