const gulp = require('gulp');
const babel = require('gulp-babel');
const watch = require('gulp-watch');
const rollup = require('gulp-rollup');
const replace = require ('rollup-plugin-replace');
const gulpSequence = require('gulp-sequence')
gulp.task('buildenv', function () {
  return watch('./src/nodeuii/**/*.js', { ignoreInitial: false }, () => {
    gulp.src('./src/nodeuii/**/*.js')
      .pipe(babel({
        babelrc: false,
        "plugins": [
          [
            "transform-decorators-legacy",
            "transform-es2015-modules-commonjs", {
            "allowTopLevelThis": true
          }]
        ]
    }))
      .pipe(gulp.dest('dist'));
  })
});

gulp.task('buildprod', function () {
  gulp.src('./src/nodeuii/**/*.js')
    .pipe(babel({
      ignore: ['./src/nodeuii/config/*.js'],
      babelrc: false,
      "plugins": [
        ["transform-decorators-legacy",
        "transform-es2015-modules-commonjs", {
          "allowTopLevelThis": true
        }]
      ]
    }))
    .pipe(gulp.dest('dist'));
});
// 开启清洗流
gulp.task('buildconfig',  () => {
  gulp.src('./src/nodeuii/**/*.js')
    .pipe(rollup({
      output:{
        format: 'cjs',
      },
      input: './src/nodeuii/config/index.js',
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production')
        })
      ]
    }))
    .pipe(gulp.dest('./dist'));
});
let _task = ['buildenv'];
if (process.env.NODE_ENV == 'production') {
  _task = gulpSequence(['buildprod','buildconfig']);
}

gulp.task('default', _task);