import ms from 'pretty-ms'
import fetch from 'node-fetch'
import Layout from './components/Layout'
import React, { useState, useEffect } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Grid, Paper, Typography } from '@material-ui/core'
import { red, green, lime, orange, lightGreen } from '@material-ui/core/colors'

import APIExecutionHistory from './components/EndpointExecutionHistory'
import EndpointCardDetails from './components/EndpointDetailsCard'
import EndpointResponseTimeChart from './components/EndpointResponseTimeChart'
import AssertionsForEndpoint from './components/AssertionsForEndpoint'
import DependenciesForEndpoint from './components/DependenciedInEndpoint'

const useStyles = makeStyles(theme => ({
	paperTitle: {
		margin: '5px 0px -15px 0px'
	}
}))

const getCurrentExecutionStatus = endpoint =>
	endpoint._status ? <span style={{ color: green[500] }}>Success</span> : <span style={{ color: red[500] }}>Fail</span>

const getSuccessRate = history => {
	if (!!history && history.length > 0) {
		let successItems = history.filter(item => item._status).length,
			totalItems = history.length
		let percentage = ((successItems * 100) / totalItems).toFixed(2)
		let color = green
		if (percentage < 50) color = red
		else if (percentage < 60) color = orange
		else if (percentage < 80) color = lime
		else if (percentage < 95) color = lightGreen

		return <span style={{ color: color[500] }}>{percentage}%</span>
	} else {
		return 'no data'
	}
}

const getAverageTime = history => {
	if (!!history && history.length > 0) {
		let totalTime = history.map(item => (item._result ? (item._result.timing ? item._result.timing.total : 0) : 0)),
			totalItems = history.length
		return `${ms(totalTime.reduce((a, c) => a + c, 0) / totalItems)}`
	} else {
		return 'no data'
	}
}

const getMaxTime = history => {
	if (!!history && history.length > 0) {
		let totalTime = history.map(item => (item._result ? (item._result.timing ? item._result.timing.total : 0) : 0))
		return `${ms(Math.max(...totalTime))}`
	} else {
		return 'no data'
	}
}

const secondaryCardDetails = (endpoint, history) => [
	{ title: 'Current execution status ', value: getCurrentExecutionStatus(endpoint) },
	{ title: 'Success Rate', value: getSuccessRate(history) },
	{ title: 'Time taken', value: endpoint._result ? (endpoint._result.timing ? ms(endpoint._result.timing.total) : 'no data') : 'no data' },
	{ title: 'Average time taken', value: getAverageTime(history) },
	{ title: 'Max time taken', value: getMaxTime(history) },
	{ title: 'Number of assertions', value: endpoint._expect ? endpoint._expect.length : 1 },
	{ title: 'Number of dependencies', value: endpoint.dependencies ? endpoint.dependencies.length : 0 }
]

const primaryCardDetails = endpoint => [
	{ title: 'Endpoint ', value: endpoint.name || 'not available' },
	{ title: 'Description', value: endpoint.description || '' },
	{ title: 'Scenario', value: endpoint.scenario || 'not available' },
	{ title: 'Collection', value: endpoint.collection || 'not available' },
	{ title: 'URL', value: endpoint.url || 'not available' },
	{ title: 'Method', value: endpoint.method || 'GET' },
	{ title: 'Repeat Count', value: endpoint.repeat || 1 }
]

const Endpoint = ({ jobId, apiId }) => {
	const classes = useStyles()

	let [mainCardDetails, setMainCardDetails] = useState([])
	let [secondCardDetails, setSecondCardDetails] = useState([])
	let [endpointDetails, setEndpointDetails] = useState({})
	let [history, setHistory] = useState([])

	useEffect(() => {
		setSecondCardDetails(secondaryCardDetails(endpointDetails, history))
	}, [endpointDetails, history])

	useEffect(() => {
		fetch(`/apis?jobId=${jobId}&_id=${apiId}`)
			.then(data => data.json())
			.then(data => {
				if (!!data && data.length > 0) {
					setEndpointDetails(data[0])
					setMainCardDetails(primaryCardDetails(data[0]))
				}
			})
		fetch(`/apis?jobId=${jobId}&_id=${apiId}`)
			.then(data => data.json())
			.then(data => {
				if (!!data) setSecondCardDetails(secondaryCardDetails(data))
			})
	}, [])

	return (
		<Layout jobId={jobId} apiId={apiId} endpoint={endpointDetails.name} scenario={endpointDetails.scenario} collection={endpointDetails.collection}>
			<Grid container spacing={3}>
				<Grid item xs={12} sm={6}>
					<EndpointCardDetails details={mainCardDetails} />
				</Grid>
				<Grid item xs={12} sm={6}>
					<EndpointCardDetails details={secondCardDetails} />
				</Grid>

				<Grid item sm={12}>
					<EndpointResponseTimeChart endpointName={endpointDetails.name} />
				</Grid>

				<Grid item sm={12}>
					<DependenciesForEndpoint dependencies={endpointDetails.dependencies} />
				</Grid>

				<Grid item sm={12}>
					<AssertionsForEndpoint assertions={endpointDetails._expect} />
				</Grid>

				<Grid item sm={12}>
					<Typography color="textSecondary" variant="subtitle2" className={classes.paperTitle}>
						Details of the past tests
					</Typography>
				</Grid>
				<Grid item sm={12}>
					<Paper>
						<APIExecutionHistory setHistory={setHistory} endpointName={endpointDetails.name} />
					</Paper>
				</Grid>
			</Grid>
		</Layout>
	)
}

export default Endpoint
