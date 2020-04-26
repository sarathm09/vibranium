import React, { useState, useEffect } from 'react'
import { Grid, Paper, Typography, Chip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { red, green, grey } from '@material-ui/core/colors'
import { CheckCircleOutline, Cancel} from '@material-ui/icons'

import Layout from './components/Layout'
import { Link } from '@reach/router'

const useStyles = makeStyles(theme => ({
	statusSuccessItem: {
		borderBottom: `3px solid ${green[500]} !important`
	},
	statusFailItem: {
		borderBottom: `3px solid ${red[500]} !important`
	},
	dateDisplay: {
		color: grey[800],
		marginTop: '1.5rem',
		marginBottom: '1.5rem'
	},
	apiDetailsDisplay: {
		color: grey[900],
		fontSize: 'small'
	},
	heading: {
		marginBottom: '1.5rem',
		marginBottom: '0.5rem',
		color: grey[800]
	}
}))

export default function JobsList() {
	const classes = useStyles()
	const [jobs, setJobs] = useState([])

	useEffect(() => {
		fetch(`/jobs?top=1000`)
			.then(data => data.json())
			.then(data => {
				if (!!data && data.length > 0) {
					setJobs(data)
				}
			})
	}, [])

	return (
		<Layout>
			<Grid container spacing={2}>
				<Grid item sm={12} className={classes.heading}>
					<Typography variant="subtitle1">Job execution history ({jobs.length})</Typography>
				</Grid>

				{jobs.map(job => (
					<Grid item sm={4} key={job._id}>
						<Link to={`/ui/jobs/${job.jobId}`} style={{ textDecoration: 'none' }}>
							<Paper elevation={5} className={job.status ? classes.statusSuccessItem : classes.statusFailItem}>
								{/* {JSON.stringify(job, null, 2)} */}
								<Grid container>
									<Grid item sm={12} md={8}>
										<Typography variant="subtitle2" style={{ color: grey[500], marginTop: '0.2rem' }}>
											{job.time}
										</Typography>
									</Grid>
									<Grid item sm={12} md={4}>
										{job.status ? (
											<Chip
												size="small"
												variant="outlined"
												style={{ color: green[500], borderColor: green[500], float: 'right' }}
												label={`${job.totalEndpointsSuccessful} / ${job.totalEndpointsExecuted}`}
												icon={<CheckCircleOutline style={{ color: green[500] }} />}
											/>
										) : (
											<Chip
												size="small"
												variant="outlined"
												style={{ color: red[500], borderColor: red[500], float: 'right' }}
												label={`${job.totalEndpointsSuccessful} / ${job.totalEndpointsExecuted}`}
												icon={<Cancel style={{ color: red[500] }} />}
											/>
										)}
									</Grid>

									<Grid item sm={12}>
										<Typography variant="subtitle2" className={classes.dateDisplay}>
											#{job.jobId}
										</Typography>
									</Grid>

									{job.executionOptions.collections && job.executionOptions.collections !== 'all' ? (
										<Grid item sm={12}>
											<Typography variant="subtitle1" className={classes.apiDetailsDisplay}>
												Collections: {job.executionOptions.collections.split(',').join(', ')}
											</Typography>
										</Grid>
									) : null}

									{job.executionOptions.collections && job.executionOptions.scenarios !== 'all' ? (
										<Grid item sm={12}>
											<Typography variant="subtitle1" className={classes.apiDetailsDisplay}>
												Scenarios: {job.executionOptions.scenarios.split(',').join(', ')}
											</Typography>
										</Grid>
									) : null}

									{job.executionOptions.collections && job.executionOptions.apis !== 'all' ? (
										<Grid item sm={12}>
											<Typography variant="subtitle1" className={classes.apiDetailsDisplay}>
												APIs: {job.executionOptions.apis.split(',').join(', ')}
											</Typography>
										</Grid>
									) : null}
								</Grid>
							</Paper>
						</Link>
					</Grid>
				))}
			</Grid>
		</Layout>
	)
}
