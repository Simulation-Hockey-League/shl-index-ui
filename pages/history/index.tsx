import { Footer } from 'components/Footer';
import { HistoryHeader } from 'components/history/HistoryHeader';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import React, { useEffect } from 'react';

export default () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/history/players');
  }, [router]);
  return (
    <>
      <NextSeo
        title="History"
        openGraph={{
          title: 'History',
        }}
      />
      <HistoryHeader />
      <Footer />
    </>
  );
};
