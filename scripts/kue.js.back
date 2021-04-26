const program = require('commander')
const config = require('config').redis
const kue = require('kue')

program
  .option('-p, --port', 'port to listen to')
  .option('-q, --prefix', 'prefix of key names used by Redis', 'q')
  .command('dashboard')
  .action(function(cmd, options) {
    kue.createQueue({
      redis: {
        host: config.host,
        port: config.port,
        db: config.db
      }
    })
    kue.app.listen(cmd)
    console.log("Kue started on " + cmd)
  })

program
  .on('command:*', () => {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => {
  console.log(`Unhandled Rejection at: Promise ${p}, reason: ${reason}`)
})

process.on('uncaughtException', function(exception) {
  console.log(exception)
})
