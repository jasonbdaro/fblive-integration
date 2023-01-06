import type { NextPage } from 'next'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Spinner from 'react-bootstrap/Spinner'
import { useRouter } from 'next/router'

const Home: NextPage = () => {
  const { register, control, getValues, setValue, watch,
    formState: { errors, isValid, isSubmitting }, handleSubmit } = useForm({
    mode: 'onChange',
  })
  const nerrors: any = errors
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [isMounted, setMounted] = useState(false)
  const router: any = useRouter()

  useEffect(() => {
    window.onLogin = function (res: any) {
      if ('connected' === res.status) {
        const accessToken = res.authResponse.accessToken
        window.FB.api('me', 'GET', {}, (me: any) => {
          window.FB.api('/me/accounts', 'GET', {}, (res: any) => {
            const arr1 = [{
              access_token: accessToken,
              name: me?.name,
            }]
            const arr2 = res.data.map((item: any) => ({
              access_token: item?.access_token,
              name: item?.name,
            }))
            const merged: any = [...arr1, ...arr2]
            if (res.data) {
              setAccounts(merged)
            }
          })
        })
      }
      if ('not_authorized' === res.status) {
        alert('Unauthorized!')
      }
      if ('unknown' === res.status) {
        alert('FB Login Error!')
      }
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      const fragmentString = location.hash.substring(1)
      const params: any = {}
      var regex = /([^&=]+)=([^&]*)/g, m
      while (m = regex.exec(fragmentString)) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2])
      }
      if (Object.keys(params).length > 0) {
        if (params['state'] && params['state'] == 'yt') {
          setTimeout(() => {
            onGoogleLogin(params['access_token'])
          }, 2000)
        }
      }
    } else {
      setMounted(true)
    }
  }, [isMounted])

  useEffect(() => {
    const subscription = watch((value: any, info: any) => {
      if ('account' === info?.name) {
        setLoading(true)
        window.FB.api('/me/live_videos', 'POST', {
          access_token: value[info?.name],
          title: 'Test Live',
          description: 'Description',
          status: 'LIVE_NOW',
        }, (res: any) => {
          const stream_url = res?.stream_url
          const searchFor = '/rtmp/'
          const index = stream_url.indexOf(searchFor) + searchFor.length
          setValue('streamid', stream_url.substring(index), {shouldValidate: true})
          setValue('streamurl', stream_url.substring(0, index), {shouldValidate: true})
          setLoading(false)
        })
      }
    })
    return () => subscription.unsubscribe()
  })

  const submit = async () => {
    if (isValid) {
      alert(JSON.stringify(getValues(), null, 4))
    }
  }

  const signinWithGoogle = () => {
    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('action', 'https://accounts.google.com/o/oauth2/v2/auth')
    const params: any = {
      client_id: '630359108130-cdsoar46ugd4ns99pn91j4i5mu8v45g7.apps.googleusercontent.com',
      redirect_uri: new URL(window.location.href).origin,
      scope: 'https://www.googleapis.com/auth/youtube \ https://www.googleapis.com/auth/youtube.force-ssl',
      state: 'yt',
      include_granted_scopes: 'true',
      response_type: 'token',
    }
    for (let p in params) {
      const input = document.createElement('input')
      input.setAttribute('type', 'hidden')
      input.setAttribute('name', p)
      input.setAttribute('value', params[p])
      form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
  }

  const onGoogleLogin = (access_token: string) => {
    let broadcastId: any
    let streamId: any
    setLoading(true)
    window.gapi.load('client', () => {
      // create broadcast
      window.gapi.client.request({
        path: 'https://www.googleapis.com/youtube/v3/liveBroadcasts',
        method: 'POST',
        params: {
          part: 'id,snippet,contentDetails,status',
        },
        body: {
          snippet: {
            title: `New Video (Broadcast): ${new Date().toISOString()}`,
            scheduledStartTime: `${new Date().toISOString()}`,
            description: 'A description of your broadcast. This field is optional.',
          },
          contentDetails: {
            recordFromStart: true,
            enableAutoStart: true,
            monitorStream: {
              enableMonitorStream: false,
            },
          },
          status: {
            privacyStatus: 'public',
          },
        },
        headers: {
          Authorization: `Bearer ${access_token}`
        },
      }).then((res: any) => {
        //setBroadcastId(res?.result?.id)
        broadcastId = res?.result?.id

        // create stream
        window.gapi.client.request({
          path: 'https://www.googleapis.com/youtube/v3/liveStreams',
          method: 'POST',
          params: {
            part: 'id,snippet,cdn,contentDetails,status',
          },
          body: {
            snippet: {
              title: `New Video (Stream): ${new Date().toISOString()}`,
              description: 'A description of your video stream. This field is optional.',
            },
            cdn: {
              frameRate: '60fps',
              ingestionType: 'rtmp',
              resolution: '1080p',
            },
            contentDetails: {
              isReusable: true,
            },
          },
          headers: {
            Authorization: `Bearer ${access_token}`
          },
        }).then((res: any) => {
          //setStreamId(res?.result?.id)
          streamId = res?.result?.id
          setValue('streamid', res?.result?.cdn?.ingestionInfo?.ingestionAddress, {shouldValidate: true})
          setValue('streamurl', res?.result?.cdn?.ingestionInfo?.streamName, {shouldValidate: true})

          // bind broadcast to stream
          window.gapi.client.request({
            path: 'https://www.googleapis.com/youtube/v3/liveBroadcasts/bind',
            method: 'POST',
            params: {
              part: ['id,snippet,contentDetails,status'],
              id: broadcastId,
              streamId: streamId,
            },
            headers: {
              Authorization: `Bearer ${access_token}`
            },
          }).then((res: any) => {
            setLoading(false)
            router.push('/', undefined, {shallow: true})

            // transition to live
            /*
            window.gapi.client.request({
              path: 'https://www.googleapis.com/youtube/v3/liveBroadcasts/transition',
              method: 'POST',
              params: {
                part: ['id,snippet,contentDetails,status'],
                broadcastStatus: 'live',
                id: broadcastId,
              },
              headers: {
                Authorization: `Bearer ${access_token}`
              },
            }).then((res: any) => {
              console.log('transition to live',res)
            })
             */
          })
        })
      })
    })
  }

  if (!isMounted) {
    return null
  }

  return (
    <div>
      <Container className="bg-black w-25 mt-5 p-5 rounded shadow">
        <Form onSubmit={handleSubmit(submit)}>
          <Form.Group className="mb-3" controlId="profile">
            <Form.Label>Stream Profile Name <span className="text-danger">*</span></Form.Label>
            <Form.Control {...register('profile', {required: true})} type="text" />
            {'required' === nerrors?.profile?.type && <Form.Text id="profile" className="text-warning">
              This field is required.
            </Form.Text>}
          </Form.Group>

          <Form.Group className="mb-3" controlId="title">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control {...register('title', {required: true})} type="text" />
            {'required' === nerrors?.title?.type && <Form.Text id="profile" className="text-warning">
              This field is required.
            </Form.Text>}
          </Form.Group>
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control {...register('description')} as="textarea" />
          </Form.Group>
          <hr />
          <div className="mt-4 mb-4">
            <div className="fb-login-button" data-onlogin="onLogin" data-scope="public_profile,pages_show_list,publish_video,pages_read_engagement,pages_manage_posts" data-width="" data-size="large" data-button-type="continue_with" data-layout="default" data-auto-logout-link="false" data-use-continue-as="true"></div>
          </div>
          <div className="mt-4 mb-4">
            <Button onClick={signinWithGoogle} type="button" variant="primary">Sign in with Google</Button>
          </div>
          <Form.Group className="mb-3" controlId="accounts">
            <Controller control={control} name="account" rules={{ required: true }} render={({ field }) => (<>
              <Form.Select aria-label="Accounts List" onChange={(value: any) => field.onChange(value)}>
                <option>Select accounts</option>
                {accounts?.map((item: any, index: number) => (
                  <option key={index} value={item?.access_token}>{item?.name}</option>
                ))}
              </Form.Select>
            </>)} />
            {'required' === nerrors?.account?.type && <Form.Text id="account" className="text-warning">
              This field is required.
            </Form.Text>}
          </Form.Group>
          <Form.Group className="mb-3" controlId="streamid">
            <Form.Label>Stream ID/KEY <span className="text-danger">*</span>
              {loading && <Spinner className="ms-1" animation="border" role="status" size="sm">
                <span className="visually-hidden">Loading...</span>
              </Spinner>}
            </Form.Label>
            <Form.Control  {...register('streamid', {required: true})} type="text" readOnly />
            {'required' === nerrors?.streamid?.type && <Form.Text id="streamid" className="text-warning">
              This field is required.
            </Form.Text>}
          </Form.Group>
          <Form.Group className="mb-3" controlId="streamurl">
            <Form.Label>Stream URL <span className="text-danger">*</span>
              {loading && <Spinner className="ms-1" animation="border" role="status" size="sm">
                <span className="visually-hidden">Loading...</span>
              </Spinner>}
            </Form.Label>
            <Form.Control  {...register('streamurl', {required: true})} type="text" readOnly />
            {'required' === nerrors?.streamurl?.type && <Form.Text id="streamurl" className="text-warning">
              This field is required.
            </Form.Text>}
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-4" disabled={isSubmitting}>
            <span className="me-1">Submit</span>
            {isSubmitting && <Spinner animation="border" role="status" size="sm">
              <span className="visually-hidden">Loading...</span>
            </Spinner>}
          </Button>
        </Form>
      </Container>
    </div>
  )
}

export default Home
