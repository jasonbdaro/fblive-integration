import '../styles/_main.scss'
import type { AppProps } from 'next/app'
import { SSRProvider } from 'react-bootstrap';
import {Fragment} from 'react'
import Script from 'next/script'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SSRProvider>
      <Fragment>
        <Component {...pageProps} />
        <Script
          id="fbinit"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.fbAsyncInit = function() {
              FB.init({
                appId      : '390753728021611',
                cookie     : true,
                xfbml      : true,
                version    : 'v14.0'
              });

              FB.AppEvents.logPageView();

            };

            (function(d, s, id){
               var js, fjs = d.getElementsByTagName(s)[0];
               if (d.getElementById(id)) {return;}
               js = d.createElement(s); js.id = id;
               js.src = "https://connect.facebook.net/en_US/sdk.js";
               fjs.parentNode.insertBefore(js, fjs);
             }(document, 'script', 'facebook-jssdk'))
            `,
          }}
        />
        <Script async defer src="https://accounts.google.com/gsi/client" />
      </Fragment>
    </SSRProvider>
  )
}

export default MyApp
