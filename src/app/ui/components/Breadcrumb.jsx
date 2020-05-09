import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Breadcrumbs from '@material-ui/core/Breadcrumbs'
import Link from '@material-ui/core/Link'

import HomeIcon from '@material-ui/icons/Home'
import FolderOpen from '@material-ui/icons/FolderOpen'
import Description from '@material-ui/icons/Description'
import Web from '@material-ui/icons/Language'

const useStyles = makeStyles(theme => ({
	link: {
		display: 'flex'
	},
	icon: {
		marginRight: theme.spacing(0.5),
		width: 20,
		height: 20
	}
}))

export default function Breadcrumb({ collection, scenario, endpoint }) {
	const classes = useStyles()
	const paths = [
		{
			key: 'collection',
			name: collection,
			icon: FolderOpen
		},
		{
			key: 'scenario',
			name: scenario,
			icon: Description
		},
		{
			key: 'endpoint',
			name: endpoint,
			icon: Web
		}
	]

	return (
		<Breadcrumbs aria-label="breadcrumb">
			<Link color="inherit" href="/ui" className={classes.link}>
				<HomeIcon className={classes.icon} />
			</Link>

			{paths.map(path => (
				<Typography color="textPrimary" className={classes.link} key={path.key}>
					<path.icon className={classes.icon} />
					{path.name}
				</Typography>
			))}
		</Breadcrumbs>
	)
}
