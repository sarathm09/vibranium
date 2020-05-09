import React from 'react'

import { Container, AppBar, Toolbar, Typography, IconButton } from '@material-ui/core'
import ArrowBackOutlinedIcon from '@material-ui/icons/ArrowBackOutlined'
import { makeStyles } from '@material-ui/core/styles'
import Breadcrumb from './Breadcrumb'
import { Link } from '@reach/router'

const useStyles = makeStyles(theme => ({
	container: {
		marginTop: '20px'
	},
	menuButton: {
		marginRight: theme.spacing(2)
	}
}))

export default ({ children, collection, scenario, endpoint, apiId, jobId }) => {
	const classes = useStyles()

	return (
		<>
			<AppBar>
				<Toolbar>
					<IconButton
						edge="start"
						className={classes.menuButton}
						color="inherit"
						aria-label="back"
						style={{ visibility: jobId ? 'visible' : 'hidden' }}
					>
						<Link to={apiId ? `/ui/jobs/${jobId}` : '/ui'}>
							<ArrowBackOutlinedIcon style={{ color: 'white' }} />
						</Link>
					</IconButton>
					<Typography variant="h5" component="h5">
						{'Vibranium Report'}
					</Typography>
				</Toolbar>
			</AppBar>

			<Toolbar />

			<Container maxWidth="md" className={classes.container}>
				{children}
			</Container>
		</>
	)
}
