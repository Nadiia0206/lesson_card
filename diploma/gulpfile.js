"use strict";

const { src, dest, series, watch, parallel } = require("gulp");
const rename       = require("gulp-rename");
const browserSync  = require("browser-sync").create();
const uglify       = require("gulp-uglify");
const htmlmin      = require("gulp-htmlmin");
const sass         = require("gulp-sass")(require("sass"));
const imagemin     = require('gulp-imagemin');
const newer        = require('gulp-newer');
const autoprefixer = require('gulp-autoprefixer');
const cleancss     = require('gulp-clean-css');
const del          = require('del');
const sourcemaps   = require('gulp-sourcemaps');
const path         = require('path');

const srcDir = "src";
const buildDir = "build";

function browsersync() {
  browserSync.init({
    server: { baseDir: `${buildDir}/` },
    notify: false,
    online: true
  });
}

function styles() {
  return src([`${srcDir}/sass/*.scss`, `${srcDir}/sass/pages/*.scss`])
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
    .pipe(cleancss({ level: { 1: { specialComments: 0 } }, sourceMap: true }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write())
    .pipe(dest((file) => {
      return file.base.replace(`${srcDir}${path.sep}sass`, `${buildDir}${path.sep}css`)
    })) 
    .pipe(browserSync.stream());
}

function scripts() {
  return src(`${srcDir}/js/**/*.js`)
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(`${buildDir}/js`))
    .pipe(browserSync.stream());
}

/**
 * @see https://github.com/sindresorhus/gulp-imagemin#custom-plugin-options
 */
function images() {
  return src(`${srcDir}/img/**/*`)
    .pipe(newer(`${buildDir}/img`))
    .pipe(imagemin())
    .pipe(dest(`${buildDir}/img`));
}

function html() {
  return src([`${srcDir}/*.html`, `${srcDir}/pages/*.html`])
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest((file) => {
      return file.base
        .replace(`${srcDir}${path.sep}pages`, `${buildDir}`)
        .replace(`${srcDir}`, `${buildDir}`);
    })) 
    .pipe(browserSync.stream());
}

function fonts() {
  return src(`${srcDir}/fonts/**/*.{ttf,woff,woff2,eot,svg}`)
    .pipe(dest(`${buildDir}/fonts`));
}

function watchFiles() {
  watch(`${srcDir}/js/**/*.js`, scripts);
  watch(`${srcDir}/**/*.html`, html);
  watch(`${srcDir}/sass/**/*.scss`, styles);
  watch(`${srcDir}/img/**/*`, images);
}

function cleanimg() {
  return del(`${buildDir}/img/**/*`, { force: true })
}

function cleandest() {
  return del(`${buildDir}/**/*`, { force: true })
}

exports.build       = series(cleandest, scripts, html, styles, images, fonts);
exports.browsersync = browsersync;
exports.images      = images;
exports.html        = html;
exports.scripts     = scripts;
exports.styles      = styles;
exports.cleanimg    = cleanimg;
exports.fonts       = fonts;
exports.cleandest   = cleandest;
exports.start       = parallel(scripts, html, styles, images, fonts, browsersync, watchFiles);
