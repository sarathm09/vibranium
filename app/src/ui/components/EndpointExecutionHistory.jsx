import React, { useState, useEffect } from 'react'

import { Tabs, Tab, Box, Grid, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core'
import { CheckCircleOutline, Cancel } from '@material-ui/icons'
import { makeStyles } from '@material-ui/core/styles'
import { green, red } from '@material-ui/core/colors'

import PropTypes from 'prop-types'
import fetch from 'node-fetch'
import ms from 'pretty-ms'

import CodeBlock from './CodeBlock'

function TabPanel(props) {
	const { children, value, index, ...other } = props

	return (
		<Typography component="div" role="tabpanel" hidden={value !== index} id={`history-${index}`} {...other}>
			{value === index && <Box p={1}>{children}</Box>}
		</Typography>
	)
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.any.isRequired,
	value: PropTypes.any.isRequired
}

const useStyles = makeStyles(theme => ({
	root: {
		flexGrow: 1,
		backgroundColor: theme.palette.background.paper,
		display: 'flex',
		height: 700,
		overflow: 'auto'
	},
	tabs: {
		borderRight: `1px solid ${theme.palette.divider}`
	},
	tabPanel: {
		overflowY: 'scroll'
	},
	variableTableKey: {
		minWidth: '10rem'
	},
	historyDetailGrid: {
		marginTop: '1.5rem'
	},
	statusSuccessItem: {
		borderLeft: `3px solid ${green[500]} !important`,
		marginBottom: '3px',
		border: '1px solid #c1d3d358'
	},
	statusFailItem: {
		borderLeft: `3px solid ${red[500]} !important`,
		marginBottom: '5px',
		border: '1px solid #c1d3d358'
	}
}))

export default function EndpointExecutionHistory({ endpointName, setHistory: setHistoryInParent }) {
	const classes = useStyles()

	const [selectedTab, setSelectedTab] = useState(0)
	const [history, setHistory] = useState([])

	useEffect(() => {
		if (!!endpointName) {
			fetch(`/apis?name=${endpointName}&select=_result,_variables,_status,jobId`)
				.then(data => data.json())
				.then(data => {
					setHistory(data)
					setHistoryInParent(data)
				})
		}
	}, [endpointName])

	const changeTab = (_, newValue) => {
		setSelectedTab(newValue)
	}

	return (
		<div className={classes.root}>
			<Tabs orientation="vertical" variant="scrollable" value={selectedTab} onChange={changeTab} className={classes.tabs}>
				{history.map((item, index) => (
					<Tab
						key={item.jobId + index}
						label={`#${item.jobId}`}
						title={`Job #${item.jobId}`}
						id={`history-tab-${index}`}
						className={item._status ? classes.statusSuccessItem : classes.statusFailItem}
					/>
				))}
			</Tabs>
			{history.map((item, index) => (
				<TabPanel className={classes.tabPanel} value={selectedTab} index={index} key={item._id}>
					<Grid container>
						<Grid item sm={12}>
							<Typography color="textSecondary" variant="h5" component="h5">
								Request
							</Typography>
						</Grid>
						<Grid item sm={12}>
							<Paper elevation={3}>
								<Grid container>
									<Grid item sm={12}>
										<Table size="small" className={'table-small'}>
											<TableBody>
												<TableRow>
													<TableCell component="td" scope="row">
														URL
													</TableCell>
													<TableCell component="td" scope="row">
														{item._result.url}
													</TableCell>
												</TableRow>
												<TableRow>
													<TableCell component="td" scope="row">
														Method
													</TableCell>
													<TableCell component="td" scope="row">
														{item._result.method}
													</TableCell>
												</TableRow>
												<TableRow>
													<TableCell component="td" scope="row">
														Expected status
													</TableCell>
													<TableCell component="td" scope="row">
														{item._result.expect ? (item._result.expect.status ? item._result.expect.status : 200) : 200}
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</Grid>
									{item._result.payload ? (
										<Grid item sm={12} className={classes.historyDetailGrid}>
											<Typography color="textSecondary" variant="subtitle2">
												Request Payload
											</Typography>
											<CodeBlock code={item._result.payload} />
										</Grid>
									) : null}
								</Grid>
							</Paper>
						</Grid>
						<Grid item sm={12} className={classes.historyDetailGrid}>
							<Typography color="textSecondary" variant="h5" component="h5">
								Response
							</Typography>
						</Grid>
						<Grid item sm={12}>
							<Paper elevation={3}>
								<Grid container>
									<Grid item sm={12}>
										<Table size="small" className={'table-small'}>
											<TableBody>
												<TableRow>
													<TableCell component="td" scope="row">
														Status code
													</TableCell>
													<TableCell component="td" scope="row">
														{item._result.status}
													</TableCell>
												</TableRow>
												<TableRow>
													<TableCell component="td" scope="row">
														Content-Type
													</TableCell>
													<TableCell component="td" scope="row">
														{item._result.contentType}
													</TableCell>
												</TableRow>
												<TableRow>
													<TableCell component="td" scope="row">
														Status
													</TableCell>
													<TableCell component="td" scope="row">
														{item._status ? <CheckCircleOutline style={{ color: green[500] }} /> : <Cancel style={{ color: red[500] }} />}
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</Grid>
									<Grid item sm={12} className={classes.historyDetailGrid}>
										<Typography color="textSecondary" variant="subtitle2">
											Response body
										</Typography>
										<CodeBlock code={item._result.response} />
									</Grid>
									{item._result.timing ? (
										<Grid item sm={12} className={classes.historyDetailGrid}>
											<Typography color="textSecondary" variant="subtitle2">
												Response timing
											</Typography>
											<Table size="small" className={'table-small'}>
												<TableBody>
													{Object.entries(item._result.timing).map(([key, value]) => (
														<TableRow key={key}>
															<TableCell component="td" scope="row">
																{key}
															</TableCell>
															<TableCell component="td" scope="row">
																{ms(value)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</Grid>
									) : null}
								</Grid>
							</Paper>
						</Grid>
						<Grid item sm={12} className={classes.historyDetailGrid}>
							<Typography color="textSecondary" variant="h5" component="h5">
								Variables
							</Typography>
						</Grid>
						<Grid item sm={12}>
							<Paper elevation={3}>
								{item._variables ? (
									<Table size="small" className={'table-small'}>
										<TableHead>
											<TableRow>
												<TableCell>Variable</TableCell>
												<TableCell>Value</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{Object.entries(item._variables).map(([key, value]) => (
												<TableRow key={key}>
													<TableCell component="td" scope="row" className={classes.variableTableKey}>
														{key}
													</TableCell>
													<TableCell component="td" scope="row">
														{value}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								) : (
									<Typography color="textSecondary" variant="i">
										None
									</Typography>
								)}
							</Paper>
						</Grid>
					</Grid>
				</TabPanel>
			))}
		</div>
	)
}
