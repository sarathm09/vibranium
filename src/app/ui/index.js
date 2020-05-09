import React from 'react'
import ReactDOM from 'react-dom'
import { Router } from '@reach/router'

import './index.css'
import JobsList from './JobsList'
import Endpoint from './Endpoint'
import EndpointsList from './EndpointsList'

ReactDOM.render(
	<Router>
		<JobsList path="ui/" />
		<JobsList path="ui/jobs" />
		<EndpointsList path="ui/jobs/:jobId" />
		<Endpoint path="ui/jobs/:jobId/apis/:apiId" />
	</Router>,
	document.getElementById('app')
)
