jsfeat.COLOR_BLUE = 13

jsfeat.imgproc.grayscale = function (n,r,A,D,g){
	if(typeof g==="undefined"){
		g=jsfeat.COLOR_RGBA2GRAY
	}
	var q=0,p=0,z=0,v=0,m=0,u=0;
	var s=4899,B=9617,C=1868,o=4;
	if(g==jsfeat.COLOR_BGRA2GRAY||g==jsfeat.COLOR_BGR2GRAY){
		s=1868;C=4899
	}

	if(g==jsfeat.COLOR_RGB2GRAY||g==jsfeat.COLOR_BGR2GRAY){
		o=3
	}

	if(g==jsfeat.COLOR_BLUE) {
		s=4899,B=9617,C=1868,o=4;

		var l=o<<1,k=(o*3)|0;
		D.resize(r,A,1);
		var t=D.data;
		for(p=0;p<A;++p,v+=r,z+=r*o){
			for(q=0,m=z,u=v;q<=r-4;q+=4,m+=o<<2,u+=4){
				t[u]=(n[m]*0+n[m+1]*0+n[m+2]*9000+8192)>>14;
				t[u+1]=(n[m+o]*0+n[m+o+1]*0+n[m+o+2]*9000+8192)>>14;
				t[u+2]=(n[m+l]*s+n[m+l+1]*B+n[m+l+2]*C+8192)>>14;
				t[u+3]=(n[m+k]*s+n[m+k+1]*B+n[m+k+2]*C+8192)>>14
			}
			for(;q<r;++q,++u,m+=o){
				t[u]=(n[m]*s+n[m+1]*B+n[m+2]*C+8192)>>14
			}
		}
	} else {
		var l=o<<1,k=(o*3)|0;
		D.resize(r,A,1);
		var t=D.data;
		for(p=0;p<A;++p,v+=r,z+=r*o){
			for(q=0,m=z,u=v;q<=r-4;q+=4,m+=o<<2,u+=4){
				t[u]=(n[m]*s+n[m+1]*B+n[m+2]*C+8192)>>14;
				t[u+1]=(n[m+o]*s+n[m+o+1]*B+n[m+o+2]*C+8192)>>14;
				t[u+2]=(n[m+l]*s+n[m+l+1]*B+n[m+l+2]*C+8192)>>14;
				t[u+3]=(n[m+k]*s+n[m+k+1]*B+n[m+k+2]*C+8192)>>14
			}
			for(;q<r;++q,++u,m+=o){
				t[u]=(n[m]*s+n[m+1]*B+n[m+2]*C+8192)>>14
			}
		}
	}
}