FROM ubuntu:zesty
MAINTAINER Fink Viktor <finkvi@gmail.com>

# install xpra
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y wget && \
    wget -O - http://winswitch.org/gpg.asc | apt-key add - && \
    echo "deb http://winswitch.org/ zesty main" > /etc/apt/sources.list.d/xpra.list && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y xpra xvfb xterm && \
    apt-get clean && \ 
    rm -rf /var/lib/apt/lists/*

# install all X apps here
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y firefox && \
    apt-get clean && \ 
    rm -rf /var/lib/apt/lists/*

# Install wine and related packages
RUN dpkg --add-architecture i386 \
		&& apt-get update \
		&& apt-get install -y --no-install-recommends \
				wine-stable \
				wine32 \
				curl \
		&& rm -rf /var/lib/apt/lists/*

# Use the latest version of winetricks
RUN curl -SL 'https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks' -o /usr/local/bin/winetricks \
		&& chmod +x /usr/local/bin/winetricks

# Get latest version of mono for wine

RUN mkdir -p /usr/share/wine/mono \
	&& curl -SL 'http://dl.winehq.org/wine/wine-mono/4.7.1/wine-mono-4.7.1.msi' -o /usr/share/wine/mono/wine-mono-4.7.1.msi \
	&& chmod +x /usr/share/wine/mono/wine-mono-4.7.1.msi

# non-root user
RUN adduser --disabled-password --gecos "User" --uid 1000 user

# set application
ADD 1Z0-202.exe /home/user/1Z0-202.exe
ADD jre-7u80-windows-i586.exe /home/user/jre-7u80-windows-i586.exe
ADD infinityExam.sh /usr/local/bin/infinityExam
RUN chown user:user /usr/local/bin/infinityExam && chmod +x /usr/local/bin/infinityExam

#USER root
#RUN chown user:user /home/user/1Z0-202.exe && chmod +x /home/user/1Z0-202.exe
#RUN chown user:user /home/user/jre-7u80-windows-i586.exe && chmod +x /home/user/jre-7u80-windows-i586.exe

USER user
ENV HOME /home/user/.wine/drive_c/java/jre/bin
ENV WINEPREFIX /home/user/.wine
ENV WINEARCH win32
ENV DISPLAY=:100

# install jre
RUN wine /home/user/jre-7u80-windows-i586.exe INSTALLDIR="C:\java\jre" /s /L C:\pathsetup.log

ADD 1Z0-202.exe /home/user/.wine/drive_c/java/jre/bin/1Z0-202.exe

EXPOSE 10000

#CMD xpra start :100 --bind-tcp=0.0.0.0:10000 --html=on --start-child=infinityExam --exit-with-children --daemon=no --pulseaudio=no --notifications=no --bell=no

#ENTRYPOINT xpra start :100 --bind-tcp=0.0.0.0:10000 --html=on --daemon=yes --pulseaudio=no --notifications=no --bell=no

CMD xpra start :100 --bind-tcp=0.0.0.0:10000 --html=on --start-child='xterm' --exit-with-children --daemon=no --pulseaudio=no --notifications=no --bell=no --printing=no --speaker=no --webcam=no
