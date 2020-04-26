import React from 'react'
import { Paper } from '@material-ui/core'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/atom-one-light.css'
import hljs from 'highlight.js/lib/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
	formattedCode: {
		boxShadow: 'inset 5px 5px 7px #c1d3d3, -5px -5px 7px #fbffff !important;',
		border: '1px solid  #c1d3d3a3 !important;',
		'&:hover': {
			boxShadow: 'inset 5px 5px 7px #a0afaf, -5px -5px 7px #ffffff !important;'
		}
	},
	codeWrap: {
		whiteSpace: 'pre-wrap'
	}
}))

export default function CodeBlock({ code }) {
	const classes = useStyles()
	hljs.registerLanguage('json', json)
	hljs.registerLanguage('xml', xml)
	hljs.configure({ useBR: true })

	return (
		<Paper className={classes.formattedCode}>
			<pre>
				{!!code && typeof code === 'object' ? (
					<code  dangerouslySetInnerHTML={{ __html: hljs.highlight('json', JSON.stringify(code, null, 1)).value }} />
				) : (
					<code dangerouslySetInnerHTML={{ __html: hljs.highlight('xml', code || '').value }} />
				)}
			</pre>
		</Paper>
	)
}
