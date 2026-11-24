# Funktionsliste (Handler pro Datei)
Zweck: Nach jedem Umbau prüfen, dass keine Funktion verloren geht. Automatisch aus dem Code erzeugt (`data-act` = Klick, `data-ch` = Änderung).

## web/index.html
- Klick (69): attopen, autadd, autdel, daytog, dpm, dpopen, dppick, druckdel, druckrefresh, druckusb, drwx, dtadd, go, godate, inhopen, jpedit, jpk, jpmk, jpmrm, jpstu, jptpl, kmlpop, kmstu, lgnew, logall, logcancel, logprint, logsave, matpop, mic, nhome, npnext, npprev, nptoday, nspane, pastopen, prnadd, prncl, prnfs, prngf, prngo, prnor, prnrm, prnsug, setnav, setskin, stabs, stchk, stcyc, stflag, stmit, stuclr, studel, stuprint, stushow, tadd, tdel, tfilter, tstat, ttadd, ttedit, ttsel, vidadd, vidrm, wknext, wkprev, wktoday, wuprep, wupull
- Änderung (12): cinfo, cnote, drsel, drup, jpmadd, jpstufe, jpsub, kvs, lgfield, stpr, stug, thmin

## web/fahrplan.js
- Klick (6): fpapply, fpask, fpgo, fpst, fpstop, fpundo
- Änderung (1): fpmode

## web/kmap.js
- Klick (142): boarddel, boardedit, boardopen, clsgo, clspop, clspopclose, clspopgo, clspopsel, clstab, go, godate, grpgo, grpreset, jpmadd2, jpmatview, jpmk, jpmrm, jppop, jppopx, jpzadd, jpzgo, jpzrm, kfadd, kfdel, kmavedit, kmback, kmcf, kmcol, kmcoladd, kmcoldel, kmcoledit, kmcolold, kmeadd, kmedel, kmew, kmgf, kmgtog, kmimgview, kmkvedit, kmlpop, kmnameedit, kmnamesave, kmnop, kmphmain, kmphopen, kmphview, kmsel, kmsok, kmsort, kmstlist, kmstlistx, kmstperf, kmstpick, kmstu, kmteach, kmteachx, kmtsel, kted, ktstd, kvbar, lgmadd, lgmrm, logprint, lpvclose, lpvgo, lsaoadd, lsbar, lscopy, lscopylink, lscopyopen, lsedit, lsepf, lsfav, lshos, lsmatadd, lsmatedit, lsmatrm, lsmatview, lspane, lsphadd, lsphmv, lsphrm, lspop, lspopclose, lsqx, lssmrm, lstake, lsview, matpop, mic, narchview, nops, nztog, rndpick, rndreset, seatdim, seatedit, seatfull, seatgo, seatreset, seattog, spadd, sparea, spareaadd, spareadel, spcat, spcoldel, spdel, spedit, spmore, spshowd, sptool, spzoom, stabs, stchk, stflag, stmit, stuprint, swclear, swlane, swpick, swreset, swstart, swstop, tcadd, tcdel, tcedit, tlfull, tlmode, tlplus, tlreset, tlset, tltog, tsadd, tscat, tsdel, tsmatview, tsmiss, tssel, tstest, tsuserm, tsuseview
- Änderung (35): cnote, grpn, jpsub, jpzg, kffld, kmbivis, kmcolname, kmcolvis, kmedate, kmemax, kmept, kmetitle, kmkvme, kmkvn, kmlimit, kmsem, kvgr, lgfield, lsck, lsphf, lsq, nsel, nzthr, spdate, sppt, sprenarea, sprendisc, spyear, stpr, thmin, tltime, tsmax, tspart, tspt, tsstoffnote

## web/lehrmaterial.js
- Klick (6): erbdel, erbgo, erbnum, kidel, kisave, kitest
- Änderung (5): erbcov, erbf, erbq, erbsel, erbvl

## web/material.js
- Klick (53): matai, matall, mataoopen, matclip, matclsmenu, matcolsreset, matconfirm, matconfirmall, matdel, matdiscard, matdl, matdurmenu, matepmenu, matfa, matfdel, matfe, matft, matfx, matgdel, matgoogle, matgrpadd, matgrpdel, mathq, mathqall, mathqx, matkind, matkindmenu, matmake, matnop, matnote0, matopen, matpedit, matpick, matpop, matretag, matrm, matrmkey, matsearch, matshowf, matthumbdel, mattitleclick, mattoggle, matunpick, matview, mdall, mdclip, mddel, mdgo, mdgoogle, mdkind, mdmode, mdnothumb, mdrmkey
- Änderung (19): matakey, matao, matatag, matdlchk, matdurin, matfq, matgnew, matmeta, matnote, matqs, matsel, mattitlein, mattitles, mattpl, matttl, mddl, mdf, mdkey, mdnew
