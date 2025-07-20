#!/usr/bin/env node
/**
 * Vibranium CLI short alias (vm)
 */

import program from './vibranium';

if (require.main === module) {
  program.parse(process.argv);
}

export default program;