import type { NextPage } from 'next'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Spinner from 'react-bootstrap/Spinner';

const Home: NextPage = () => {
  const { register, control, getValues, setValue, reset, watch,
    formState: { errors, isValid, isSubmitting }, handleSubmit } = useForm({
    mode: 'onChange',
  })
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    window.onLogin = function (res: any) {
      if ('connected' === res.status) {
        console.log('Connected!')
        const accessToken = res.authResponse.accessToken
        console.log(accessToken)
        window.FB.api('/me/accounts', 'GET', {}, (res: any) => {
          if (res.data) {
            setAccounts(res.data.map((item: any) => ({
              access_token: item?.access_token,
              name: item?.name,
            })))
          }
        })
      }
      if ('not_authorized' === res.status) {
        console.log('Unauthorized!')
      }
      if ('unknown' === res.status) {
        console.log('Error')
      }
    }
  }, [])


  useEffect(() => {
    const subscription = watch((value: any, info: any) => {
      if ('account' === info?.name) {
        setLoading(true)
        window.FB.api('/me/live_videos', 'POST', {access_token: value[info?.name]}, (res: any) => {
          console.log('res', res)
          setValue('streamid', res?.id, {shouldValidate: true})
          setValue('streamurl', res?.stream_url, {shouldValidate: true})
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

  return (
    <div>
      <Container className="bg-black w-25 mt-5 p-5 rounded shadow">
        <Form onSubmit={handleSubmit(submit)}>
          <Form.Group className="mb-3" controlId="profile">
            <Form.Label>Stream Profile Name <span className="text-danger">*</span></Form.Label>
            <Form.Control {...register('profile', {required: true})} type="text" />
            {'required' === errors?.profile?.type && <Form.Text id="profile" className="text-warning">
              This field is required.
            </Form.Text>}
          </Form.Group>

          <Form.Group className="mb-3" controlId="title">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control {...register('title', {required: true})} type="text" />
            {'required' === errors?.title?.type && <Form.Text id="profile" className="text-warning">
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
          <Form.Group className="mb-3" controlId="accounts">
            <Controller control={control} name="account" rules={{ required: true }} render={({ field }) => (<>
              <Form.Select aria-label="Accounts List" onChange={(value: any) => field.onChange(value)}>
                <option>Select accounts</option>
                {accounts?.map((item: any, index: number) => (
                  <option key={index} value={item?.access_token}>{item?.name}</option>
                ))}
              </Form.Select>
            </>)} />
            {'required' === errors?.account?.type && <Form.Text id="account" className="text-warning">
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
            {'required' === errors?.streamid?.type && <Form.Text id="streamid" className="text-warning">
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
            {'required' === errors?.streamurl?.type && <Form.Text id="streamurl" className="text-warning">
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
